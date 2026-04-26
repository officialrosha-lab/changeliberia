import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  InstitutionType,
  InstitutionCategory,
  ContactPriorityLevel,
} from '@prisma/client';
import csv from 'csv-parser';
import { Readable } from 'stream';

export interface CSVRow {
  institutionName?: string;
  type?: string;
  category?: string;
  departmentName?: string;
  email?: string;
  secondaryEmails?: string;
  phone?: string;
  tags?: string;
  priorityLevel?: string;
  contactName?: string;
  official?: string;
  verified?: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  createdInstitutions: number;
  createdDepartments: number;
  createdContacts: number;
  skippedRows: number;
  errors: Array<{
    row: number;
    reason: string;
  }>;
  warnings: string[];
}

@Injectable()
export class BulkImportService {
  private readonly logger = new Logger(BulkImportService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Parse CSV file and import institutions + departments + contacts
   * @param fileBuffer Buffer from uploaded file
   * @returns ImportResult with stats and errors
   */
  async importFromCSV(fileBuffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: 0,
      processedRows: 0,
      createdInstitutions: 0,
      createdDepartments: 0,
      createdContacts: 0,
      skippedRows: 0,
      errors: [],
      warnings: [],
    };

    return new Promise((resolve, reject) => {
      const rows: CSVRow[] = [];

      const stream = Readable.from([fileBuffer]);
      stream
        .pipe(csv())
        .on('data', (row: CSVRow) => {
          rows.push(row);
        })
        .on('end', async () => {
          try {
            result.totalRows = rows.length;
            await this.processCSVRows(rows, result);
            result.success = result.errors.length === 0;
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error: Error) => {
          reject(new BadRequestException(`CSV parsing error: ${error.message}`));
        });
    });
  }

  /**
   * Process parsed CSV rows and create database records
   */
  private async processCSVRows(
    rows: CSVRow[],
    result: ImportResult,
  ): Promise<void> {
    const institutionMap = new Map<string, string>(); // name -> id
    const departmentMap = new Map<string, string>(); // "${institutionId}:${name}" -> id

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const rowNumber = rowIndex + 2; // +2: 1 for header, 1 for 1-based indexing

      try {
        // Skip empty rows
        if (!row.institutionName || !row.institutionName.trim()) {
          result.skippedRows++;
          continue;
        }

        // Validate required fields
        if (!row.email) {
          result.errors.push({
            row: rowNumber,
            reason: 'Missing required field: email',
          });
          continue;
        }

        this.validateEmail(row.email);

        // ===== INSTITUTION =====
        let institutionId = institutionMap.get(row.institutionName);

        if (!institutionId) {
          institutionId = await this.createOrFindInstitution(
            row,
          );

          if (institutionId) {
            institutionMap.set(row.institutionName, institutionId);
            result.createdInstitutions++;
          } else {
            result.errors.push({
              row: rowNumber,
              reason: `Failed to create institution: ${row.institutionName}`,
            });
            continue;
          }
        }

        // ===== DEPARTMENT =====
        let departmentId: string | undefined;

        if (row.departmentName && row.departmentName.trim()) {
          const deptKey = `${institutionId}:${row.departmentName}`;
          departmentId = departmentMap.get(deptKey);

          if (!departmentId) {
            departmentId = await this.createOrFindDepartment(
              institutionId,
              row,
            );

            if (departmentId) {
              departmentMap.set(deptKey, departmentId);
              result.createdDepartments++;
            } else {
              result.warnings.push(
                `Row ${rowNumber}: Could not create department "${row.departmentName}" for ${row.institutionName}`,
              );
            }
          }
        }

        // ===== CONTACT DIRECTORY =====
        const contactId = await this.createContact(
          institutionId,
          departmentId,
          row,
        );

        if (contactId) {
          result.createdContacts++;
        }

        result.processedRows++;
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.logger.log(
      `CSV Import completed: ${result.processedRows}/${result.totalRows} rows processed, ` +
        `${result.createdInstitutions} institutions, ${result.createdDepartments} departments, ` +
        `${result.createdContacts} contacts created`,
    );
  }

  /**
   * Create or find institution
   */
  private async createOrFindInstitution(row: CSVRow): Promise<string | undefined> {
    try {
      // Validate required fields
      if (!row.institutionName || !row.email) {
        return undefined;
      }

      const type = this.parseInstitutionType(row.type) || InstitutionType.GOVERNMENT;
      const category = this.parseInstitutionCategory(row.category) ||
        InstitutionCategory.AGENCY;

      // Try to find existing institution
      const existing = await this.prisma.institution.findFirst({
        where: {
          name: {
            equals: row.institutionName.trim(),
            mode: 'insensitive',
          },
          type,
        },
      });

      if (existing) {
        return existing.id;
      }

      // Create new institution
      const secondaryEmails = row.secondaryEmails
        ? row.secondaryEmails
            .split(';')
            .map(e => e.trim())
            .filter(e => e)
        : [];

      const institution = await this.prisma.institution.create({
        data: {
          name: row.institutionName.trim(),
          type,
          category,
          officialEmail: row.email.trim(),
          secondaryEmails: JSON.stringify(secondaryEmails),
          phone: row.phone?.trim() || null,
          verified: row.verified?.toLowerCase() === 'true',
        },
      });

      return institution.id;
    } catch (error) {
      this.logger.error(
        `Error creating institution: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  /**
   * Create or find department
   */
  private async createOrFindDepartment(
    institutionId: string,
    row: CSVRow,
  ): Promise<string | undefined> {
    try {
      if (!row.departmentName || !row.email) {
        return undefined;
      }

      // Try to find existing department
      const existing = await this.prisma.institutionDepartment.findFirst({
        where: {
          institutionId,
          name: {
            equals: row.departmentName.trim(),
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        return existing.id;
      }

      // Create new department
      const department = await this.prisma.institutionDepartment.create({
        data: {
          institutionId,
          name: row.departmentName.trim(),
          email: row.email.trim(),
          phone: row.phone?.trim() || null,
        },
      });

      return department.id;
    } catch (error) {
      this.logger.error(
        `Error creating department: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  /**
   * Create contact directory entry
   */
  private async createContact(
    institutionId: string,
    departmentId: string | undefined,
    row: CSVRow,
  ): Promise<string | null> {
    try {
      if (!row.email) {
        return null;
      }

      // Parse tags
      const tags = row.tags
        ? row.tags
            .split(';')
            .map(t => t.trim().toLowerCase())
            .filter(t => t)
        : [];

      const priorityLevel = this.parsePriorityLevel(row.priorityLevel) ||
        ContactPriorityLevel.MEDIUM;

      const contact = await this.prisma.contactDirectory.create({
        data: {
          institutionId,
          departmentId: departmentId || null,
          issueTags: JSON.stringify(tags),
          priorityLevel,
          isPrimary: row.official?.toLowerCase() === 'true',
          email: row.email.trim(),
          phone: row.phone?.trim() || null,
          contactName: row.contactName?.trim() || null,
        },
      });

      return contact.id;
    } catch (error) {
      this.logger.error(
        `Error creating contact: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Generate template CSV content
   */
  generateTemplateCSV(): string {
    const headers = [
      'institutionName',
      'type',
      'category',
      'departmentName',
      'email',
      'secondaryEmails',
      'phone',
      'tags',
      'priorityLevel',
      'contactName',
      'official',
      'verified',
    ];

    const exampleRows = [
      [
        'Ministry of Public Works',
        'GOVERNMENT',
        'MINISTRY',
        'Roads & Bridges',
        'info@mopw.gov.lr',
        'roads@mopw.gov.lr;highways@mopw.gov.lr',
        '+231661234567',
        'roads;infrastructure;pothole',
        'HIGH',
        'John Doe',
        'true',
        'true',
      ],
      [
        'National Utility Authority',
        'GOVERNMENT',
        'UTILITY',
        'Electricity Distribution',
        'contact@nua.gov.lr',
        'support@nua.gov.lr',
        '+231661234568',
        'electricity;power;blackout',
        'HIGH',
        'Jane Smith',
        'true',
        'true',
      ],
      [
        'Ministry of Education',
        'GOVERNMENT',
        'MINISTRY',
        'Education Policy',
        'info@moe.gov.lr',
        '',
        '+231661234569',
        'education;schools;teachers',
        'MEDIUM',
        'Robert Johnson',
        'false',
        'true',
      ],
      [
        'Health Foundation NGO',
        'NGO',
        'NGO',
        'Community Health',
        'admin@healthfdn.org',
        '',
        '+231661234570',
        'health;hospitals;clinics',
        'MEDIUM',
        'Maria Garcia',
        'false',
        'true',
      ],
    ];

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row =>
        row.map(cell => `"${cell}"`).join(','),
      ),
    ].join('\n');

    return csvContent;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Parse institution type from string
   */
  private parseInstitutionType(typeStr?: string): InstitutionType | null {
    if (!typeStr) return null;

    const type = typeStr.trim().toUpperCase();
    if (Object.values(InstitutionType).includes(type as InstitutionType)) {
      return type as InstitutionType;
    }

    return null;
  }

  /**
   * Parse institution category from string
   */
  private parseInstitutionCategory(
    categoryStr?: string,
  ): InstitutionCategory | null {
    if (!categoryStr) return null;

    const category = categoryStr.trim().toUpperCase();
    if (Object.values(InstitutionCategory).includes(category as InstitutionCategory)) {
      return category as InstitutionCategory;
    }

    return null;
  }

  /**
   * Parse priority level from string
   */
  private parsePriorityLevel(levelStr?: string): ContactPriorityLevel | null {
    if (!levelStr) return null;

    const level = levelStr.trim().toUpperCase();
    if (Object.values(ContactPriorityLevel).includes(level as ContactPriorityLevel)) {
      return level as ContactPriorityLevel;
    }

    return null;
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException(`Invalid email format: ${email}`);
    }
  }

  /**
   * Get import statistics
   */
  async getImportStats() {
    const totalInstitutions = await this.prisma.institution.count();
    const totalDepartments = await this.prisma.institutionDepartment.count();
    const totalContacts = await this.prisma.contactDirectory.count();
    const verifiedInstitutions = await this.prisma.institution.count({
      where: { verified: true },
    });

    return {
      totalInstitutions,
      totalDepartments,
      totalContacts,
      verifiedInstitutions,
      unverifiedInstitutions: totalInstitutions - verifiedInstitutions,
    };
  }
}
