import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
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
