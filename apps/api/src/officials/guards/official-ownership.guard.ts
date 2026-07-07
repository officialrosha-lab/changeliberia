import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Scopes officials-facing endpoints to the Institution the current user
 * holds. Route param `institutionId` is used when present (e.g. admin
 * actions on a specific institution); otherwise falls back to resolving
 * the institution via `holderUserId === user.userId` ("my dashboard").
 * ADMIN always passes.
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

    if (user.role === 'ADMIN') return true;

    const institutionId = request.params?.institutionId;

    const institution = institutionId
      ? await this.prisma.institution.findUnique({ where: { id: institutionId } })
      : await this.prisma.institution.findUnique({ where: { holderUserId: user.userId } });

    if (!institution) {
      throw new NotFoundException('Official institution not found');
    }

    if (institution.holderUserId !== user.userId) {
      throw new ForbiddenException('You do not hold this office');
    }

    if (institution.officialStatus !== 'VERIFIED') {
      throw new ForbiddenException('Official account is not verified');
    }

    request.officialInstitution = institution;
    return true;
  }
}
