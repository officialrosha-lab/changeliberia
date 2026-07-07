import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface OfficialAccess {
  isOfficeholder: boolean;
  canView: boolean;
  canDraft: boolean;
  canRespond: boolean;
  canManageInbox: boolean;
  canGenerateReports: boolean;
}

/**
 * Scopes officials-facing endpoints to the Institution the current user
 * holds, OR one they've been granted ACTIVE delegated-staff access to
 * (Public Officials Portal: delegated office staff). Route param
 * `institutionId` is used when present (e.g. admin actions on a specific
 * institution); otherwise falls back to resolving the institution via
 * `holderUserId === user.userId` first, then staff membership ("my
 * dashboard"). ADMIN always passes with full access.
 *
 * Attaches `request.officialInstitution` and `request.officialAccess` (the
 * latter distinguishes officeholder vs. staff and their canX flags) — write
 * actions that only the officeholder or a specifically-permitted staff
 * member may perform must check `request.officialAccess` themselves; this
 * guard only establishes "has some relationship to this institution".
 */
@Injectable()
export class OfficialOwnershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === 'ADMIN') {
      request.officialAccess = {
        isOfficeholder: true,
        canView: true,
        canDraft: true,
        canRespond: true,
        canManageInbox: true,
        canGenerateReports: true,
      } satisfies OfficialAccess;
      return true;
    }

    const institutionId = request.params?.institutionId;

    let institution = institutionId
      ? await this.prisma.institution.findUnique({ where: { id: institutionId } })
      : await this.prisma.institution.findUnique({ where: { holderUserId: user.userId } });

    let access: OfficialAccess | null = null;

    if (institution && institution.holderUserId === user.userId) {
      access = {
        isOfficeholder: true,
        canView: true,
        canDraft: true,
        canRespond: true,
        canManageInbox: true,
        canGenerateReports: true,
      };
    } else {
      // Not (or not yet resolved as) the officeholder — check delegated
      // staff access. If institutionId wasn't in the route, resolve it via
      // the caller's own ACTIVE staff membership ("my dashboard" case).
      const staff = institutionId
        ? await this.prisma.officialStaffMember.findUnique({
            where: { institutionId_userId: { institutionId, userId: user.userId } },
          })
        : await this.prisma.officialStaffMember.findFirst({
            where: { userId: user.userId, status: 'ACTIVE' },
          });

      if (staff && staff.status === 'ACTIVE') {
        institution = institution ?? (await this.prisma.institution.findUnique({ where: { id: staff.institutionId } }));
        access = {
          isOfficeholder: false,
          canView: staff.canView,
          canDraft: staff.canDraft,
          canRespond: staff.canRespond,
          canManageInbox: staff.canManageInbox,
          canGenerateReports: staff.canGenerateReports,
        };
      }
    }

    if (!institution || !access) {
      throw new NotFoundException('Official institution not found');
    }

    if (institution.officialStatus !== 'VERIFIED') {
      throw new ForbiddenException('Official account is not verified');
    }

    request.officialInstitution = institution;
    request.officialAccess = access;
    return true;
  }
}
