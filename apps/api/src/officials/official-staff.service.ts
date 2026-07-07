import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { RolePermissionService } from '../rbac/role-permission.service';
import { InviteStaffDto, UpdateStaffPermissionsDto } from './dto';

/**
 * Public Officials Portal — delegated office staff (leftover work).
 * Only the officeholder (Institution.holderUserId) may invite/revoke/update
 * staff — staff members can never manage other staff, even if they hold
 * canManageInbox/canRespond, since inviting staff is an ownership action,
 * not a delegated one.
 */
@Injectable()
export class OfficialStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLoggerService,
    private readonly rolePermissionService: RolePermissionService,
  ) {}

  private async assertIsOfficeholder(institutionId: string, userId: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    if (institution.holderUserId !== userId) {
      throw new ForbiddenException('Only the officeholder can manage staff');
    }
    return institution;
  }

  async invite(institutionId: string, officeholderId: string, dto: InviteStaffDto) {
    await this.assertIsOfficeholder(institutionId, officeholderId);

    const invitee = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!invitee) {
      throw new BadRequestException('No Change Liberia account found for that phone number');
    }
    if (invitee.id === officeholderId) {
      throw new BadRequestException('You cannot invite yourself as staff');
    }

    const existing = await this.prisma.officialStaffMember.findUnique({
      where: { institutionId_userId: { institutionId, userId: invitee.id } },
    });
    if (existing && existing.status !== 'REVOKED') {
      throw new ConflictException('This person is already staff (or has a pending invite) for your office');
    }

    const staff = existing
      ? await this.prisma.officialStaffMember.update({
          where: { id: existing.id },
          data: {
            role: dto.role,
            status: 'INVITED',
            canDraft: dto.canDraft ?? false,
            canRespond: dto.canRespond ?? false,
            canManageInbox: dto.canManageInbox ?? false,
            canGenerateReports: dto.canGenerateReports ?? false,
            invitedBy: officeholderId,
            invitedAt: new Date(),
            revokedAt: null,
          },
        })
      : await this.prisma.officialStaffMember.create({
          data: {
            institutionId,
            userId: invitee.id,
            role: dto.role,
            status: 'INVITED',
            canDraft: dto.canDraft ?? false,
            canRespond: dto.canRespond ?? false,
            canManageInbox: dto.canManageInbox ?? false,
            canGenerateReports: dto.canGenerateReports ?? false,
            invitedBy: officeholderId,
          },
        });

    this.activityLogger.logAsync({
      userId: officeholderId,
      action: 'OFFICIAL_STAFF_INVITED',
      entityType: 'OFFICIAL_STAFF_MEMBER',
      entityId: staff.id,
      description: `Invited ${invitee.fullName} as ${dto.role} staff`,
    });

    return staff;
  }

  async list(institutionId: string) {
    return this.prisma.officialStaffMember.findMany({
      where: { institutionId, status: { not: 'REVOKED' } },
      include: { user: { select: { id: true, fullName: true, phone: true, email: true } } },
      orderBy: { invitedAt: 'desc' },
    });
  }

  async updatePermissions(institutionId: string, officeholderId: string, staffId: string, dto: UpdateStaffPermissionsDto) {
    await this.assertIsOfficeholder(institutionId, officeholderId);
    const staff = await this.prisma.officialStaffMember.findUnique({ where: { id: staffId } });
    if (!staff || staff.institutionId !== institutionId) throw new NotFoundException('Staff member not found');

    return this.prisma.officialStaffMember.update({
      where: { id: staffId },
      data: { ...dto },
    });
  }

  async revoke(institutionId: string, officeholderId: string, staffId: string) {
    await this.assertIsOfficeholder(institutionId, officeholderId);
    const staff = await this.prisma.officialStaffMember.findUnique({ where: { id: staffId } });
    if (!staff || staff.institutionId !== institutionId) throw new NotFoundException('Staff member not found');

    const updated = await this.prisma.officialStaffMember.update({
      where: { id: staffId },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    this.activityLogger.logAsync({
      userId: officeholderId,
      action: 'OFFICIAL_STAFF_REVOKED',
      entityType: 'OFFICIAL_STAFF_MEMBER',
      entityId: staffId,
      description: 'Revoked staff access',
    });

    return updated;
  }

  /**
   * Accept a pending invite — the invited user must confirm before they
   * gain access (INVITED -> ACTIVE). Called by the invitee, not the
   * officeholder.
   */
  async acceptInvite(userId: string, staffId: string) {
    const staff = await this.prisma.officialStaffMember.findUnique({ where: { id: staffId } });
    if (!staff || staff.userId !== userId) throw new NotFoundException('Invite not found');
    if (staff.status !== 'INVITED') throw new BadRequestException('This invite is no longer pending');

    const updated = await this.prisma.officialStaffMember.update({
      where: { id: staffId },
      data: { status: 'ACTIVE', joinedAt: new Date() },
    });

    // Staff need the same baseline OFFICIAL RBAC role officeholders get on
    // approval — PermissionGuard checks OFFICIAL/INBOX/RESPONSE resource
    // permissions before OfficialOwnershipGuard ever runs, so without this
    // a staff member would be blocked before their canX flags are even
    // considered. Fine-grained restriction still comes from the guard +
    // explicit controller checks, not from RBAC itself.
    const officialRole = await this.prisma.role.findUnique({ where: { name: 'OFFICIAL' } });
    if (officialRole) {
      await this.rolePermissionService.assignRoleToUser(userId, officialRole.id);
    }

    return updated;
  }

  async listMyInvites(userId: string) {
    return this.prisma.officialStaffMember.findMany({
      where: { userId, status: 'INVITED' },
      include: { institution: { select: { id: true, name: true, category: true } } },
      orderBy: { invitedAt: 'desc' },
    });
  }

  /**
   * Resolves the caller's effective access to an institution: the
   * officeholder always has full access; an ACTIVE staff member has
   * whatever their canX flags grant. Returns null if the user has no
   * relationship to the institution at all.
   */
  async resolveAccess(institutionId: string, userId: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) return null;

    if (institution.holderUserId === userId) {
      return {
        isOfficeholder: true,
        canView: true,
        canDraft: true,
        canRespond: true,
        canManageInbox: true,
        canGenerateReports: true,
      };
    }

    const staff = await this.prisma.officialStaffMember.findUnique({
      where: { institutionId_userId: { institutionId, userId } },
    });
    if (!staff || staff.status !== 'ACTIVE') return null;

    return {
      isOfficeholder: false,
      canView: staff.canView,
      canDraft: staff.canDraft,
      canRespond: staff.canRespond,
      canManageInbox: staff.canManageInbox,
      canGenerateReports: staff.canGenerateReports,
    };
  }
}
