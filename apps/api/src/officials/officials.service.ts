import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InstitutionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { RolePermissionService } from '../rbac/role-permission.service';
import {
  ClaimInstitutionDto,
  CreateOfficialApplicationDto,
  UpdateOfficialProfileDto,
  RejectOfficialDto,
} from './dto';

function slugify(name: string, county?: string | null) {
  const base = [name, county].filter(Boolean).join('-');
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Directory emails stay private until the claimant is verified; the domain
// alone is enough to disambiguate (e.g. i***@mopw.gov.lr).
function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  return `${email[0]}***${email.slice(at)}`;
}

function isClaimApplication(metadata: string | null): boolean {
  try {
    return JSON.parse(metadata ?? '{}')?.claimApplication === true;
  } catch {
    return false;
  }
}

@Injectable()
export class OfficialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLoggerService,
    private readonly eventEmitter: EventEmitter2,
    private readonly rolePermissionService: RolePermissionService,
  ) {}

  async apply(userId: string, dto: CreateOfficialApplicationDto) {
    const existing = await this.prisma.institution.findUnique({
      where: { holderUserId: userId },
    });
    if (existing) {
      throw new ConflictException('You already have an official account application');
    }

    let slug = slugify(dto.name, dto.county);
    const slugTaken = await this.prisma.institution.findUnique({ where: { slug } });
    if (slugTaken) slug = `${slug}-${Date.now().toString(36)}`;

    const institution = await this.prisma.institution.create({
      data: {
        name: dto.name,
        type: InstitutionType.GOVERNMENT,
        category: dto.category,
        officialEmail: dto.officialEmail,
        phone: dto.phone,
        county: dto.county,
        district: dto.district,
        politicalParty: dto.politicalParty,
        holderUserId: userId,
        officialStatus: 'PENDING_REVIEW',
        slug,
        officialProfile: {
          create: {
            bio: dto.bio,
            photoUrl: dto.photoUrl,
            verificationDocUrl: dto.verificationDocUrl,
            verificationDocType: dto.verificationDocType,
            submittedAt: new Date(),
          },
        },
      },
      include: { officialProfile: true },
    });

    await this.prisma.institutionStatusLog.create({
      data: {
        institutionId: institution.id,
        status: 'PENDING_REVIEW',
        note: 'Official account application submitted',
        actorUserId: userId,
      },
    });

    this.activityLogger.logAsync({
      userId,
      action: 'OFFICIAL_APPLICATION_SUBMITTED',
      entityType: 'INSTITUTION',
      entityId: institution.id,
      description: `Official application submitted for ${institution.name}`,
    });

    return institution;
  }

  /**
   * Directory institutions (admin-created, no holder) that an official can
   * claim instead of creating a duplicate. REJECTED is included as a safety
   * net only — the real gate is holderUserId: null (apply-created rejections
   * keep their holder; rejected claims are released back to UNVERIFIED).
   */
  async listClaimable(search: string) {
    const term = search.trim();
    if (term.length < 2) return [];

    const rows = await this.prisma.institution.findMany({
      where: {
        holderUserId: null,
        officialStatus: { in: ['UNVERIFIED', 'REJECTED'] },
        type: InstitutionType.GOVERNMENT,
        name: { contains: term, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        county: true,
        district: true,
        city: true,
        officialEmail: true,
        verified: true,
      },
      orderBy: { name: 'asc' },
      take: 20,
    });

    return rows.map((row) => ({ ...row, officialEmail: maskEmail(row.officialEmail) }));
  }

  /**
   * Claim an existing directory institution instead of creating a duplicate.
   * Attaches the caller as holder and moves it to PENDING_REVIEW — from there
   * the admin approve/reject path is identical to a created application.
   */
  async claim(userId: string, dto: ClaimInstitutionDto) {
    const existing = await this.prisma.institution.findUnique({
      where: { holderUserId: userId },
    });
    if (existing) {
      throw new ConflictException('You already have an official account application');
    }

    const institution = await this.prisma.institution.findUnique({
      where: { id: dto.institutionId },
    });
    if (!institution) throw new NotFoundException('Institution not found');
    if (
      institution.holderUserId !== null ||
      !['UNVERIFIED', 'REJECTED'].includes(institution.officialStatus)
    ) {
      throw new ConflictException('This institution is not available to claim');
    }

    // Directory entries have no slug; generate one so the public profile
    // works after approval. An existing slug is left untouched.
    let slug: string | undefined;
    if (!institution.slug) {
      slug = slugify(institution.name, institution.county);
      const slugTaken = await this.prisma.institution.findUnique({ where: { slug } });
      if (slugTaken) slug = `${slug}-${Date.now().toString(36)}`;
    }

    let parsedMetadata: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(institution.metadata ?? '{}');
      if (parsed && typeof parsed === 'object') parsedMetadata = parsed;
    } catch {
      /* malformed metadata — start fresh, don't block the claim */
    }
    const metadata = JSON.stringify({
      ...parsedMetadata,
      claimApplication: true,
      claimedAt: new Date().toISOString(),
    });

    let claimed;
    try {
      claimed = await this.prisma.$transaction(async (tx) => {
        // Guarded updateMany makes the claim race-safe: a concurrent claim on
        // the same institution matches zero rows here and gets a 409.
        const result = await tx.institution.updateMany({
          where: {
            id: dto.institutionId,
            holderUserId: null,
            officialStatus: { in: ['UNVERIFIED', 'REJECTED'] },
          },
          data: {
            holderUserId: userId,
            officialStatus: 'PENDING_REVIEW',
            slug,
            phone: dto.phone,
            politicalParty: dto.politicalParty,
            metadata,
          },
        });
        if (result.count === 0) {
          throw new ConflictException('This institution has already been claimed');
        }

        // Upsert, not create: a re-claim after rejection finds an existing
        // profile row. This also guarantees approve()/reject()'s unconditional
        // profile update never hits a missing row.
        await tx.institutionOfficialProfile.upsert({
          where: { institutionId: dto.institutionId },
          create: {
            institutionId: dto.institutionId,
            bio: dto.bio,
            photoUrl: dto.photoUrl,
            verificationDocUrl: dto.verificationDocUrl,
            verificationDocType: dto.verificationDocType,
            submittedAt: new Date(),
          },
          update: {
            bio: dto.bio,
            photoUrl: dto.photoUrl,
            verificationDocUrl: dto.verificationDocUrl,
            verificationDocType: dto.verificationDocType,
            submittedAt: new Date(),
            reviewedBy: null,
            reviewedAt: null,
            reviewNotes: null,
          },
        });

        await tx.institutionStatusLog.create({
          data: {
            institutionId: dto.institutionId,
            status: 'PENDING_REVIEW',
            note: 'Official claimed existing directory institution',
            actorUserId: userId,
          },
        });

        return tx.institution.findUnique({
          where: { id: dto.institutionId },
          include: { officialProfile: true },
        });
      });
    } catch (error: any) {
      // Same user double-submitting across institutions violates the
      // holderUserId unique constraint.
      if (error?.code === 'P2002') {
        throw new ConflictException('You already have an official account application');
      }
      throw error;
    }

    this.activityLogger.logAsync({
      userId,
      action: 'OFFICIAL_CLAIM_SUBMITTED',
      entityType: 'INSTITUTION',
      entityId: dto.institutionId,
      description: `Official claim submitted for ${claimed?.name ?? dto.institutionId}`,
    });

    return claimed;
  }

  /**
   * Resolves the institution a "me"-style endpoint should operate on:
   * either one the caller holds directly, or — if delegated staff — one
   * they've been granted ACTIVE staff access to. Callers that need to
   * distinguish officeholder vs. staff (e.g. to gate a write action by a
   * specific canX permission) should also call staffService.resolveAccess().
   */
  async getMyInstitution(userId: string) {
    const held = await this.prisma.institution.findUnique({
      where: { holderUserId: userId },
      include: { officialProfile: true },
    });
    if (held) return held;

    const staffMembership = await this.prisma.officialStaffMember.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
    if (staffMembership) {
      const institution = await this.prisma.institution.findUnique({
        where: { id: staffMembership.institutionId },
        include: { officialProfile: true },
      });
      if (institution) return institution;
    }

    throw new NotFoundException('No official account found for this user');
  }

  async updateMyProfile(institutionId: string, dto: UpdateOfficialProfileDto) {
    return this.prisma.institutionOfficialProfile.update({
      where: { institutionId },
      data: { ...dto },
    });
  }

  async listPending() {
    const rows = await this.prisma.institution.findMany({
      where: { officialStatus: 'PENDING_REVIEW' },
      include: { officialProfile: true, holderUser: { select: { id: true, fullName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({ ...row, isClaim: isClaimApplication(row.metadata) }));
  }

  async approve(institutionId: string, adminUserId: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    if (institution.officialStatus !== 'PENDING_REVIEW') {
      throw new BadRequestException('Only pending applications can be approved');
    }

    const updated = await this.prisma.institution.update({
      where: { id: institutionId },
      data: { officialStatus: 'VERIFIED', verified: true, lastVerifiedAt: new Date() },
    });

    await this.prisma.institutionStatusLog.create({
      data: { institutionId, status: 'VERIFIED', actorUserId: adminUserId },
    });
    await this.prisma.institutionOfficialProfile.update({
      where: { institutionId },
      data: { reviewedBy: adminUserId, reviewedAt: new Date() },
    });

    this.activityLogger.logAsync({
      adminId: adminUserId,
      action: 'OFFICIAL_APPROVED',
      entityType: 'INSTITUTION',
      entityId: institutionId,
      description: `Approved official account for ${updated.name}`,
    });

    if (updated.holderUserId) {
      const officialRole = await this.prisma.role.findUnique({ where: { name: 'OFFICIAL' } });
      if (officialRole) {
        await this.rolePermissionService.assignRoleToUser(updated.holderUserId, officialRole.id);
      }

      const holder = await this.prisma.user.findUnique({
        where: { id: updated.holderUserId },
        select: { email: true },
      });
      this.eventEmitter.emit('official.verified', {
        userId: updated.holderUserId,
        userEmail: holder?.email,
        institutionId: updated.id,
        institutionName: updated.name,
      });
    }

    return updated;
  }

  async reject(institutionId: string, adminUserId: string, dto: RejectOfficialDto) {
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    if (institution.officialStatus !== 'PENDING_REVIEW') {
      throw new BadRequestException('Only pending applications can be rejected');
    }

    const updated = await this.prisma.institution.update({
      where: { id: institutionId },
      data: { officialStatus: 'REJECTED' },
    });

    await this.prisma.institutionStatusLog.create({
      data: { institutionId, status: 'REJECTED', note: dto.notes, actorUserId: adminUserId },
    });
    await this.prisma.institutionOfficialProfile.update({
      where: { institutionId },
      data: { reviewedBy: adminUserId, reviewedAt: new Date(), reviewNotes: dto.notes },
    });

    this.activityLogger.logAsync({
      adminId: adminUserId,
      action: 'OFFICIAL_REJECTED',
      entityType: 'INSTITUTION',
      entityId: institutionId,
      description: `Rejected official account application for ${updated.name}`,
    });

    if (updated.holderUserId) {
      const holder = await this.prisma.user.findUnique({
        where: { id: updated.holderUserId },
        select: { email: true },
      });
      this.eventEmitter.emit('official.rejected', {
        userId: updated.holderUserId,
        userEmail: holder?.email,
        institutionId: updated.id,
        institutionName: updated.name,
        reason: dto.notes,
      });
    }

    // A rejected *claim* releases the directory entry so it stays claimable;
    // apply-created institutions keep the holder and stay REJECTED. This must
    // run after the official.rejected emit above, which reads holderUserId.
    if (isClaimApplication(institution.metadata)) {
      await this.prisma.institution.update({
        where: { id: institutionId },
        data: { holderUserId: null, officialStatus: 'UNVERIFIED' },
      });
      await this.prisma.institutionStatusLog.create({
        data: {
          institutionId,
          status: 'UNVERIFIED',
          note: 'Claim rejected; institution released back to directory',
          actorUserId: adminUserId,
        },
      });
    }

    return updated;
  }

  async getPublicProfile(slug: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { slug },
      include: { officialProfile: true },
    });
    if (!institution || institution.officialStatus !== 'VERIFIED') {
      throw new NotFoundException('Official not found');
    }

    const [activePetitions, resolvedCount] = await Promise.all([
      this.prisma.petitionGovernmentResponse.count({
        where: { institutionId: institution.id, currentStage: { notIn: ['RESOLVED', 'CLOSED'] } },
      }),
      this.prisma.petitionGovernmentResponse.count({
        where: { institutionId: institution.id, currentStage: { in: ['RESOLVED', 'CLOSED'] } },
      }),
    ]);

    return {
      id: institution.id,
      slug: institution.slug,
      name: institution.name,
      category: institution.category,
      county: institution.county,
      district: institution.district,
      politicalParty: institution.politicalParty,
      termStartDate: institution.termStartDate,
      termEndDate: institution.termEndDate,
      officialEmail: institution.officialEmail,
      phone: institution.phone,
      bio: institution.officialProfile?.bio ?? null,
      photoUrl: institution.officialProfile?.photoUrl ?? null,
      officeHours: institution.officialProfile?.officeHours ?? null,
      officeAddress: institution.officialProfile?.officeAddress ?? null,
      socialLinks: institution.officialProfile?.socialLinks ?? '[]',
      stats: { activePetitions, resolvedCount },
    };
  }
}
