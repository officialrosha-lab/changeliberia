import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Institution,
  ContactDirectory,
  RoutingLog,
  RoutingDecision,
  InstitutionDepartment,
  InstitutionCategory,
} from '@prisma/client';

interface RoutingMatch {
  institution: Institution & {
    departments: InstitutionDepartment[];
    contacts: ContactDirectory[];
  };
  matchedTags: string[];
  departmentId?: string;
  department?: InstitutionDepartment;
}

export interface RoutingResult {
  institutionId: string;
  departmentId?: string;
  recipientEmails: string[];
  ccEmails: string[];
  decision: RoutingDecision;
  matchedTags: string[];
  fallbackReason?: string;
  notes: string;
}

@Injectable()
export class SmartRoutingService {
  private readonly logger = new Logger(SmartRoutingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Main routing logic: Find best institution match for a petition
   * @param petitionTitle Title of petition (used for keyword extraction)
   * @param petitionCategory Category (e.g., "health", "infrastructure")
   * @param petitionTags Array of tags (e.g., ["roads", "electricity"])
   * @returns RoutingResult with institution details and emails
   */
  async routePetition(
    petitionTitle: string,
    petitionCategory: string | null,
    petitionTags: string[] = [],
  ): Promise<RoutingResult> {
    this.logger.debug(
      `Routing petition: title="${petitionTitle}", category="${petitionCategory}", tags=${JSON.stringify(petitionTags)}`,
    );

    // Extract tags from title if not provided
    const allTags = this.extractAndNormalizeTags(petitionTitle, petitionTags);

    // Step 1: Try to find matching institution by tags
    let match = await this.findMatchingInstitution(allTags, petitionCategory);

    if (match) {
      this.logger.debug(
        `Found matching institution: ${match.institution.name} (${match.institution.id}) with tags: ${match.matchedTags.join(', ')}`,
      );
      return this.buildRoutingResult(
        match,
        RoutingDecision.MATCHED,
        allTags,
      );
    }

    // Step 2: Fallback to category-based matching
    if (petitionCategory) {
      match = await this.findMatchingByCategory(petitionCategory);

      if (match) {
        this.logger.debug(
          `Found category-based match: ${match.institution.name}`,
        );
        return this.buildRoutingResult(
          match,
          RoutingDecision.FALLBACK,
          allTags,
          `No tag match found. Used category: ${petitionCategory}`,
        );
      }
    }

    // Step 3: Final fallback - use primary government contact or highest priority
    const fallbackInstitution =
      await this.findFallbackInstitution();

    if (fallbackInstitution) {
      this.logger.debug(
        `Using fallback institution: ${fallbackInstitution.institution.name}`,
      );
      return this.buildRoutingResult(
        fallbackInstitution,
        RoutingDecision.FALLBACK,
        allTags,
        'No matches found. Using default fallback.',
      );
    }

    // Step 4: Complete failure - no institutions configured
    this.logger.warn('No institutions configured for fallback routing');
    return {
      institutionId: '',
      recipientEmails: [],
      ccEmails: [],
      decision: RoutingDecision.FAILED,
      matchedTags: [],
      fallbackReason: 'No institutions available for routing',
      notes: 'CRITICAL: No institutions found. Admin must manually assign.',
    };
  }

  /**
   * Find institution by matching petition tags against ContactDirectory issueTags
   * Prioritizes HIGH priority contacts first, then MEDIUM, then LOW
   */
  private async findMatchingInstitution(
    tags: string[],
    category?: string | null,
  ): Promise<RoutingMatch | null> {
    if (!tags || tags.length === 0) {
      return null;
    }

    // Normalize tags to lowercase for comparison
    const normalizedTags = tags.map(t => t.toLowerCase());

    // Get all contacts with tags
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
            contacts: true,
          },
        },
        department: true,
      },
    });

    // Score each contact based on tag matches
    const scoredMatches = contacts
      .map(contact => {
        const contactTags = JSON.parse(contact.issueTags || '[]')
          .map((t: string) => t.toLowerCase()) as string[];

        // Find matching tags
        const matched = normalizedTags.filter(tag =>
          contactTags.includes(tag),
        );

        if (matched.length === 0) {
          return null;
        }

        // Score: prioritize primary contacts and HIGH priority
        let score = matched.length; // Base score: number of matches
        if (contact.isPrimary) score *= 1.5;
        if (contact.priorityLevel === 'HIGH') score *= 1.3;
        if (contact.priorityLevel === 'MEDIUM') score *= 1.1;

        return {
          contact,
          matchedTags: matched,
          score,
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => b.score - a.score);

    if (scoredMatches.length === 0) {
      return null;
    }

    const bestMatch = scoredMatches[0];
    return {
      institution: bestMatch.contact.institution,
      matchedTags: bestMatch.matchedTags,
      departmentId: bestMatch.contact.departmentId || undefined,
      department: bestMatch.contact.department || undefined,
    };
  }

  /**
   * Fallback: Find institution by category
   */
  private async findMatchingByCategory(
    category: string,
  ): Promise<RoutingMatch | null> {
    const categoryMap: { [key: string]: string[] } = {
      health: ['HEALTH', 'UTILITY'],
      education: ['EDUCATION', 'MINISTRY'],
      infrastructure: ['AGENCY', 'UTILITY'],
      security: ['SECURITY', 'AGENCY'],
      environment: ['AGENCY', 'NGO'],
      finance: ['MINISTRY', 'AGENCY'],
      roads: ['MINISTRY', 'AGENCY'],
      electricity: ['UTILITY', 'AGENCY'],
      water: ['UTILITY', 'AGENCY'],
    };

    const categoryList = (categoryMap[category.toLowerCase()] || []) as InstitutionCategory[];

    if (categoryList.length === 0) {
      return null;
    }

    // Find verified institution matching category
    const institution = await this.prisma.institution.findFirst({
      where: {
        category: {
          in: categoryList,
        },
        verified: true,
      },
      include: {
        departments: true,
        contacts: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    if (!institution) {
      return null;
    }

    return {
      institution,
      matchedTags: [],
    };
  }

  /**
   * Final fallback: Use primary government contact or highest priority institution
   */
  private async findFallbackInstitution(): Promise<RoutingMatch | null> {
    // Try to find a primary contact first
    const primaryContact = await this.prisma.contactDirectory.findFirst({
      where: {
        isPrimary: true,
        institution: {
          verified: true,
        },
      },
      include: {
        institution: {
          include: {
            departments: true,
            contacts: true,
          },
        },
        department: true,
      },
    });

    if (primaryContact) {
      return {
        institution: primaryContact.institution,
        matchedTags: [],
        departmentId: primaryContact.departmentId || undefined,
        department: primaryContact.department || undefined,
      };
    }

    // Fallback: Get highest priority institution
    const highestPriority = await this.prisma.contactDirectory.findFirst({
      where: {
        institution: {
          verified: true,
        },
      },
      include: {
        institution: {
          include: {
            departments: true,
            contacts: true,
          },
        },
        department: true,
      },
      orderBy: [
        { priorityLevel: 'desc' }, // HIGH, MEDIUM, LOW
        { isPrimary: 'desc' },
        { institution: { name: 'asc' } },
      ],
    });

    if (highestPriority) {
      return {
        institution: highestPriority.institution,
        matchedTags: [],
        departmentId: highestPriority.departmentId || undefined,
        department: highestPriority.department || undefined,
      };
    }

    return null;
  }

  /**
   * Extract and normalize tags from petition
   * Combines extracted keywords with provided tags
   */
  private extractAndNormalizeTags(
    title: string,
    providedTags: string[] = [],
  ): string[] {
    // Keywords commonly used in petitions
    const commonKeywords: { [key: string]: string[] } = {
      road: ['roads', 'street', 'pothole', 'pavement', 'highway', 'bridge'],
      electricity: ['power', 'light', 'blackout', 'generator', 'current', 'electricity'],
      health: [
        'hospital',
        'clinic',
        'medicine',
        'doctor',
        'patient',
        'vaccine',
      ],
      education: ['school', 'teacher', 'student', 'university', 'exam'],
      water: ['water', 'tap', 'pipe', 'well', 'pump'],
      security: ['police', 'security', 'robbery', 'theft', 'crime'],
      waste: ['garbage', 'trash', 'dump', 'waste', 'litter'],
      environment: ['environment', 'pollution', 'forest', 'tree'],
    };

    const titleLower = title.toLowerCase();
    const extracted = new Set<string>();

    // Extract keywords from title
    Object.entries(commonKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (titleLower.includes(keyword)) {
          extracted.add(category);
        }
      });
    });

    // Combine with provided tags
    const allTags = [
      ...Array.from(extracted),
      ...providedTags.map(t => t.toLowerCase()),
    ];

    // Remove duplicates and return
    return Array.from(new Set(allTags));
  }

  /**
   * Get recipient and CC emails for an institution
   */
  private getInstitutionEmails(
    institution: Institution & {
      departments: InstitutionDepartment[];
      contacts: ContactDirectory[];
    },
    departmentId?: string,
  ): { to: string[]; cc: string[] } {
    const to: string[] = [];
    const cc: string[] = [];

    // Add official email as primary recipient
    if (institution.officialEmail) {
      to.push(institution.officialEmail);
    }

    // If department specified, use department email
    if (departmentId) {
      const dept = institution.departments.find(d => d.id === departmentId);
      if (dept && dept.email) {
        to.push(dept.email);
      }
    }

    // Add secondary emails to CC
    const secondaryEmails = JSON.parse(institution.secondaryEmails || '[]') as string[];
    cc.push(...secondaryEmails);

    // Add contact emails from ContactDirectory
    const contactEmails = institution.contacts
      .filter(c => c.email)
      .map(c => c.email) as string[];
    cc.push(...contactEmails);

    // Remove duplicates
    const uniqueTo = Array.from(new Set(to)).filter(e => e);
    const uniqueCc = Array.from(new Set(cc))
      .filter(e => e && !uniqueTo.includes(e));

    return {
      to: uniqueTo,
      cc: uniqueCc,
    };
  }

  /**
   * Build final routing result
   */
  private buildRoutingResult(
    match: RoutingMatch,
    decision: RoutingDecision,
    allTags: string[],
    fallbackReason?: string,
  ): RoutingResult {
    const emails = this.getInstitutionEmails(
      match.institution,
      match.departmentId,
    );

    const notes =
      decision === RoutingDecision.MATCHED
        ? `Matched on tags: ${match.matchedTags.join(', ')}`
        : `Routed to ${match.institution.name}${
            fallbackReason ? ' - ' + fallbackReason : ''
          }`;

    return {
      institutionId: match.institution.id,
      departmentId: match.departmentId,
      recipientEmails: emails.to,
      ccEmails: emails.cc,
      decision,
      matchedTags: match.matchedTags,
      fallbackReason,
      notes,
    };
  }

  /**
   * Log routing decision for audit trail and analytics
   */
  async logRoutingDecision(
    petitionId: string,
    result: RoutingResult,
    adminOverrideBy?: string,
  ): Promise<RoutingLog> {
    const log = await this.prisma.routingLog.create({
      data: {
        petitionId,
        institutionId: result.institutionId || null,
        departmentId: result.departmentId || null,
        decision:
          adminOverrideBy && result.decision !== RoutingDecision.FAILED
            ? RoutingDecision.MANUAL_OVERRIDE
            : result.decision,
        matchedTags: JSON.stringify(result.matchedTags),
        fallbackReason: result.fallbackReason || null,
        manualOverrideBy: adminOverrideBy || null,
        recipientEmails: JSON.stringify(result.recipientEmails),
        ccEmails: JSON.stringify(result.ccEmails),
        adminNotes: result.notes,
      },
    });

    return log;
  }

  /**
   * Get routing stats for analytics
   */
  async getRoutingStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.prisma.routingLog.groupBy({
      by: ['decision', 'institutionId'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });

    const emailStats = await this.prisma.routingLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        decision: true,
        emailSentAt: true,
        emailDeliveredAt: true,
        emailFailureReason: true,
      },
    });

    const totalRouted = emailStats.length;
    const emailsSent = emailStats.filter(e => e.emailSentAt).length;
    const emailsDelivered = emailStats.filter(e => e.emailDeliveredAt).length;
    const emailsFailed = emailStats.filter(
      e => e.emailFailureReason !== null,
    ).length;

    return {
      totalRouted,
      emailsSent,
      emailsDelivered,
      emailsFailed,
      deliveryRate:
        emailsSent > 0
          ? ((emailsDelivered / emailsSent) * 100).toFixed(2) + '%'
          : '0%',
      decisionBreakdown: stats,
    };
  }

  /**
   * Manual override - reassign routing to different institution
   */
  async overrideRouting(
    petitionId: string,
    newInstitutionId: string,
    departmentId?: string,
    adminUserId?: string,
    notes?: string,
  ): Promise<RoutingLog> {
    const institution = await this.prisma.institution.findUnique({
      where: { id: newInstitutionId },
      include: {
        departments: true,
        contacts: true,
      },
    });

    if (!institution) {
      throw new Error(`Institution not found: ${newInstitutionId}`);
    }

    const emails = this.getInstitutionEmails(institution, departmentId);

    const log = await this.prisma.routingLog.create({
      data: {
        petitionId,
        institutionId: newInstitutionId,
        departmentId: departmentId || null,
        decision: RoutingDecision.MANUAL_OVERRIDE,
        manualOverrideBy: adminUserId || null,
        recipientEmails: JSON.stringify(emails.to),
        ccEmails: JSON.stringify(emails.cc),
        adminNotes: notes || `Manually routed to ${institution.name}`,
      },
    });

    this.logger.log(
      `Petition ${petitionId} manually routed to ${institution.name} by ${adminUserId}`,
    );

    return log;
  }
}
