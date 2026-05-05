import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole, VerificationType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestUser } from '../auth/roles.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationService } from '../verification/verification.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verification: VerificationService,
  ) {}

  @Get('users')
  async listUsers(
    @Query('page') page = '0',
    @Query('limit') limit = '20',
    @Query('search') search = '',
  ) {
    const skip = Number(page) * Number(limit);
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    return this.prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        trustScore: true,
        verificationStatus: true,
        createdAt: true,
      },
    });
  }

  @Get('petitions/pending')
  pendingPetitions() {
    return this.prisma.petition.findMany({
      where: { status: 'PENDING' },
      select: { id: true, title: true, category: true, summary: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get('id-documents/pending')
  pendingIdDocuments() {
    return this.prisma.iDDocument.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, fullName: true, phone: true } } },
    });
  }

  @Delete('petitions/:id')
  async deletePetition(@Param('id') id: string) {
    try {
      const petition = await this.prisma.petition.findUnique({ where: { id } });
      if (!petition) throw new NotFoundException('Petition not found');

      // Delete all child records explicitly — do not rely on DB-level cascades
      // because cascade migrations may not have run on the production database.
      await this.prisma.$transaction(async (tx) => {
        await tx.fraudEvent.deleteMany({ where: { petitionId: id } });
        await tx.signature.deleteMany({ where: { petitionId: id } });
        await tx.petitionComment.deleteMany({ where: { petitionId: id } });
        await tx.petitionFollower.deleteMany({ where: { petitionId: id } });
        await tx.petitionUpdate.deleteMany({ where: { petitionId: id } });
        await tx.petitionSubmission.deleteMany({ where: { petitionId: id } });
        await tx.petitionMilestone.deleteMany({ where: { petitionId: id } });
        await tx.socialEngagementBadge.deleteMany({ where: { petitionId: id } });
        await tx.customAudience.deleteMany({ where: { petitionId: id } });
        // ShareLink before Referral — ShareLink.referralId is SetNull, not Cascade
        await tx.shareLink.deleteMany({ where: { petitionId: id } });
        await tx.referral.deleteMany({ where: { petitionId: id } });
        await tx.routingLog.deleteMany({ where: { petitionId: id } });
        await tx.petition.delete({ where: { id } });
      });

      return { success: true, message: 'Petition deleted' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[admin] deletePetition ${id} failed:`, msg);
      throw new InternalServerErrorException(`Failed to delete petition: ${msg}`);
    }
  }

  @Patch('id-documents/:id')
  async reviewDoc(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    const doc = await this.prisma.iDDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    const updated = await this.prisma.iDDocument.update({
      where: { id },
      data: { status: body.status, reviewedBy: req.user.userId },
    });
    if (body.status === 'APPROVED') {
      const prior = await this.prisma.verificationLog.findFirst({
        where: { userId: doc.userId, type: VerificationType.ID_UPLOAD },
      });
      if (!prior) {
        await this.verification.applyEvent(
          doc.userId,
          VerificationType.ID_UPLOAD,
          30,
          `Government ID approved (${doc.type})`,
        );
      }
    }
    return updated;
  }

  @Get('fraud/flags')
  async flags() {
    const [verificationFlags, fraudEvents] = await Promise.all([
      this.prisma.verificationLog.findMany({
        where: { type: 'FRAUD' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.fraudEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return [
      ...verificationFlags.map((entry) => ({
        id: entry.id,
        details: entry.details,
        createdAt: entry.createdAt,
      })),
      ...fraudEvents.map((entry) => ({
        id: entry.id,
        details: `${entry.ruleKey}: ${entry.details}`,
        createdAt: entry.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 100);
  }
}
