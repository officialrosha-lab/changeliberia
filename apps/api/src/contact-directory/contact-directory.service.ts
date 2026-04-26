import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Institution,
  InstitutionDepartment,
  ContactDirectory,
  InstitutionType,
  InstitutionCategory,
  ContactPriorityLevel,
} from '@prisma/client';

export interface CreateInstitutionDto {
  name: string;
  type: InstitutionType;
  category: InstitutionCategory;
  officialEmail: string;
  secondaryEmails?: string[];
  contactPerson?: string;
  phone?: string;
  logo?: string;
  description?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
}

export interface UpdateInstitutionDto {
  name?: string;
  officialEmail?: string;
  secondaryEmails?: string[];
  contactPerson?: string;
  phone?: string;
  verified?: boolean;
  logo?: string;
  description?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
}

export interface CreateDepartmentDto {
  name: string;
  email: string;
  phone?: string;
  description?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  email?: string;
  phone?: string;
  description?: string;
}

export interface CreateContactDirectoryDto {
  issueTags: string[];
  priorityLevel: ContactPriorityLevel;
  isPrimary?: boolean;
  email?: string;
  phone?: string;
  contactName?: string;
  departmentId?: string;
}

export interface UpdateContactDirectoryDto {
  issueTags?: string[];
  priorityLevel?: ContactPriorityLevel;
  isPrimary?: boolean;
  email?: string;
  phone?: string;
  contactName?: string;
  departmentId?: string;
}

@Injectable()
export class ContactDirectoryService {
  constructor(private prisma: PrismaService) {}

  // ==================== INSTITUTION METHODS ====================

  /**
   * Create a new institution
   */
  async createInstitution(
    dto: CreateInstitutionDto,
  ): Promise<Institution> {
    // Validate email format
    this.validateEmail(dto.officialEmail);

    // Check for duplicate institution name + type
    const existing = await this.prisma.institution.findFirst({
      where: {
        name: {
          equals: dto.name,
          mode: 'insensitive',
        },
        type: dto.type,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Institution "${dto.name}" of type ${dto.type} already exists`,
      );
    }

    // Validate secondary emails
    const secondaryEmails = dto.secondaryEmails || [];
    secondaryEmails.forEach(email => this.validateEmail(email));

    const institution = await this.prisma.institution.create({
      data: {
        name: dto.name,
        type: dto.type,
        category: dto.category,
        officialEmail: dto.officialEmail,
        secondaryEmails: JSON.stringify(secondaryEmails),
        contactPerson: dto.contactPerson,
        phone: dto.phone,
        logo: dto.logo,
        description: dto.description,
        website: dto.website,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
      },
    });

    return institution;
  }

  /**
   * Update institution details
   */
  async updateInstitution(
    id: string,
    dto: UpdateInstitutionDto,
  ): Promise<Institution> {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) {
      throw new NotFoundException(`Institution not found: ${id}`);
    }

    // Validate emails if provided
    if (dto.officialEmail) {
      this.validateEmail(dto.officialEmail);
    }
    if (dto.secondaryEmails) {
      dto.secondaryEmails.forEach(email => this.validateEmail(email));
    }

    const updateData: any = { ...dto };
    if (dto.secondaryEmails) {
      updateData.secondaryEmails = JSON.stringify(dto.secondaryEmails);
    }

    return this.prisma.institution.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Get institution with all details
   */
  async getInstitution(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        departments: true,
        contacts: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!institution) {
      throw new NotFoundException(`Institution not found: ${id}`);
    }

    // Parse JSON fields
    return {
      ...institution,
      secondaryEmails: JSON.parse(institution.secondaryEmails || '[]'),
      contacts: institution.contacts.map(c => ({
        ...c,
        issueTags: JSON.parse(c.issueTags || '[]'),
      })),
    };
  }

  /**
   * List all institutions with optional filters
   */
  async listInstitutions(filters?: {
    type?: InstitutionType;
    category?: InstitutionCategory;
    verified?: boolean;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.verified !== undefined) {
      where.verified = filters.verified;
    }

    if (filters?.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          officialEmail: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const institutions = await this.prisma.institution.findMany({
      where,
      include: {
        departments: { select: { id: true, name: true } },
        contacts: { select: { id: true, isPrimary: true } },
      },
      orderBy: { name: 'asc' },
    });

    return institutions.map(inst => ({
      ...inst,
      secondaryEmails: JSON.parse(inst.secondaryEmails || '[]'),
      departmentCount: inst.departments.length,
      contactCount: inst.contacts.length,
      primaryContact: inst.contacts.find(c => c.isPrimary),
    }));
  }

  /**
   * Verify institution (mark as verified for public use)
   */
  async verifyInstitution(id: string): Promise<Institution> {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) {
      throw new NotFoundException(`Institution not found: ${id}`);
    }

    return this.prisma.institution.update({
      where: { id },
      data: {
        verified: true,
        lastVerifiedAt: new Date(),
      },
    });
  }

  /**
   * Delete institution and cascade related records
   */
  async deleteInstitution(id: string): Promise<void> {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) {
      throw new NotFoundException(`Institution not found: ${id}`);
    }

    await this.prisma.institution.delete({
      where: { id },
    });
  }

  // ==================== DEPARTMENT METHODS ====================

  /**
   * Create department under institution
   */
  async createDepartment(
    institutionId: string,
    dto: CreateDepartmentDto,
  ): Promise<InstitutionDepartment> {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException(`Institution not found: ${institutionId}`);
    }

    // Validate email
    this.validateEmail(dto.email);

    // Check for duplicate department name in this institution
    const existing = await this.prisma.institutionDepartment.findFirst({
      where: {
        institutionId,
        name: {
          equals: dto.name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Department "${dto.name}" already exists in this institution`,
      );
    }

    return this.prisma.institutionDepartment.create({
      data: {
        institutionId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        description: dto.description,
      },
    });
  }

  /**
   * Update department
   */
  async updateDepartment(
    departmentId: string,
    dto: UpdateDepartmentDto,
  ): Promise<InstitutionDepartment> {
    const department = await this.prisma.institutionDepartment.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException(`Department not found: ${departmentId}`);
    }

    if (dto.email) {
      this.validateEmail(dto.email);
    }

    return this.prisma.institutionDepartment.update({
      where: { id: departmentId },
      data: dto,
    });
  }

  /**
   * Get department details
   */
  async getDepartment(departmentId: string) {
    const department = await this.prisma.institutionDepartment.findUnique({
      where: { id: departmentId },
      include: {
        institution: true,
        contacts: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department not found: ${departmentId}`);
    }

    return {
      ...department,
      contacts: department.contacts.map(c => ({
        ...c,
        issueTags: JSON.parse(c.issueTags || '[]'),
      })),
    };
  }

  /**
   * List departments for institution
   */
  async listDepartments(institutionId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException(`Institution not found: ${institutionId}`);
    }

    return this.prisma.institutionDepartment.findMany({
      where: { institutionId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Delete department
   */
  async deleteDepartment(departmentId: string): Promise<void> {
    const department = await this.prisma.institutionDepartment.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException(`Department not found: ${departmentId}`);
    }

    await this.prisma.institutionDepartment.delete({
      where: { id: departmentId },
    });
  }

  // ==================== CONTACT DIRECTORY METHODS ====================

  /**
   * Create routing contact (tag-based routing entry)
   */
  async createContact(
    institutionId: string,
    dto: CreateContactDirectoryDto,
  ): Promise<ContactDirectory> {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException(`Institution not found: ${institutionId}`);
    }

    // Validate department if provided
    if (dto.departmentId) {
      const department = await this.prisma.institutionDepartment.findUnique({
        where: { id: dto.departmentId },
      });

      if (!department || department.institutionId !== institutionId) {
        throw new BadRequestException(
          `Department not found or does not belong to this institution`,
        );
      }
    }

    // Validate emails if provided
    if (dto.email) {
      this.validateEmail(dto.email);
    }

    // Normalize and validate tags
    const normalizedTags = this.normalizeTags(dto.issueTags);

    // If marking as primary, unset other primary contacts for this institution
    if (dto.isPrimary) {
      await this.prisma.contactDirectory.updateMany({
        where: {
          institutionId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    return this.prisma.contactDirectory.create({
      data: {
        institutionId,
        departmentId: dto.departmentId || null,
        issueTags: JSON.stringify(normalizedTags),
        priorityLevel: dto.priorityLevel,
        isPrimary: dto.isPrimary || false,
        email: dto.email,
        phone: dto.phone,
        contactName: dto.contactName,
      },
    });
  }

  /**
   * Update contact directory entry
   */
  async updateContact(
    contactId: string,
    dto: UpdateContactDirectoryDto,
  ): Promise<ContactDirectory> {
    const contact = await this.prisma.contactDirectory.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException(`Contact not found: ${contactId}`);
    }

    if (dto.email) {
      this.validateEmail(dto.email);
    }

    const updateData: any = { ...dto };
    if (dto.issueTags) {
      updateData.issueTags = JSON.stringify(this.normalizeTags(dto.issueTags));
    }

    // If marking as primary, unset other primary contacts for this institution
    if (dto.isPrimary) {
      await this.prisma.contactDirectory.updateMany({
        where: {
          institutionId: contact.institutionId,
          isPrimary: true,
          id: {
            not: contactId,
          },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    return this.prisma.contactDirectory.update({
      where: { id: contactId },
      data: updateData,
    });
  }

  /**
   * Get single contact
   */
  async getContact(contactId: string) {
    const contact = await this.prisma.contactDirectory.findUnique({
      where: { id: contactId },
      include: {
        institution: true,
        department: true,
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact not found: ${contactId}`);
    }

    return {
      ...contact,
      issueTags: JSON.parse(contact.issueTags || '[]'),
    };
  }

  /**
   * List contacts for institution
   */
  async listContacts(institutionId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException(`Institution not found: ${institutionId}`);
    }

    const contacts = await this.prisma.contactDirectory.findMany({
      where: { institutionId },
      include: {
        department: { select: { name: true } },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { priorityLevel: 'desc' },
      ],
    });

    return contacts.map(c => ({
      ...c,
      issueTags: JSON.parse(c.issueTags || '[]'),
    }));
  }

  /**
   * Search institutions by tags
   */
  async searchByTags(tags: string[]) {
    const normalizedTags = tags.map(t => t.toLowerCase());

    const contacts = await this.prisma.contactDirectory.findMany({
      where: {
        institution: {
          verified: true,
        },
      },
      include: {
        institution: {
          include: {
            departments: true,
          },
        },
        department: true,
      },
    });

    const matches = contacts
      .map(contact => {
        const contactTags = JSON.parse(contact.issueTags || '[]')
          .map((t: string) => t.toLowerCase()) as string[];
        const matched = normalizedTags.filter(tag =>
          contactTags.includes(tag),
        );

        return {
          ...contact,
          issueTags: contactTags,
          matchedTags: matched,
          matchCount: matched.length,
        };
      })
      .filter(c => c.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount);

    return matches;
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId: string): Promise<void> {
    const contact = await this.prisma.contactDirectory.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException(`Contact not found: ${contactId}`);
    }

    await this.prisma.contactDirectory.delete({
      where: { id: contactId },
    });
  }

  // ==================== UTILITY METHODS ====================

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
   * Normalize tags: lowercase, remove duplicates, trim
   */
  private normalizeTags(tags: string[]): string[] {
    return Array.from(
      new Set(
        tags
          .map(t => t.toLowerCase().trim())
          .filter(t => t.length > 0),
      ),
    );
  }
}
