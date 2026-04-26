import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole, VerificationType } from '@prisma/client';
import { createReadStream, existsSync } from 'fs';
import { extname } from 'path';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitIdDocumentBodyDto } from './dto';
import { IdDocumentStorageService } from './id-document-storage.service';
import type { MemoryUploadedFile } from './uploaded-file.types';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(
    private readonly service: VerificationService,
    private readonly prisma: PrismaService,
    private readonly idStorage: IdDocumentStorageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('completed')
  async completedSteps(@Req() req: { user: { userId: string } }) {
    const logs = await this.prisma.verificationLog.findMany({
      where: { userId: req.user.userId },
      select: { type: true },
    });
    const types = new Set(logs.map((l) => String(l.type)));
    return {
      phone: types.has('OTP'),
      geo: types.has('IP_GEO'),
      device: types.has('DEVICE'),
      idDocument: types.has('ID_UPLOAD'),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('phone')
  verifyPhone(@Req() req: { user: { userId: string } }) {
    return this.service.applyEvent(
      req.user.userId,
      VerificationType.OTP,
      40,
      'Phone OTP completed',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('geo')
  verifyGeo(
    @Req() req: { user: { userId: string } },
    @Body() body: { countryCode?: string },
  ) {
    const isLiberia = (body.countryCode ?? '').toUpperCase() === 'LR';
    return this.service.applyEvent(
      req.user.userId,
      VerificationType.IP_GEO,
      isLiberia ? 20 : 5,
      `IP resolved as ${body.countryCode ?? 'unknown'}`,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('device')
  verifyDevice(@Req() req: { user: { userId: string } }) {
    return this.service.applyEvent(
      req.user.userId,
      VerificationType.DEVICE,
      10,
      'Device fingerprint linked',
    );
  }

  /**
   * Serves locally stored ID files to the document owner or an admin.
   * External `fileUrl` values redirect to http(s) targets only.
   */
  @UseGuards(JwtAuthGuard)
  @Get('id-documents/:id/file')
  async downloadIdDocumentFile(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Res() res: Response,
  ): Promise<void> {
    const doc = await this.prisma.iDDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    const isOwner = doc.userId === req.user.userId;
    const isAdmin = req.user.role === UserRole.ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenException();

    const diskName = this.idStorage.extractDiskFilename(doc.fileUrl);
    if (!diskName) {
      let target: URL;
      try {
        target = new URL(doc.fileUrl);
      } catch {
        throw new NotFoundException('File not available');
      }
      if (target.protocol !== 'http:' && target.protocol !== 'https:') {
        throw new BadRequestException('Invalid file URL');
      }
      res.redirect(302, doc.fileUrl);
      return;
    }

    const abs = this.idStorage.resolveSafeAbsolutePath(diskName);
    if (!abs || !existsSync(abs)) throw new NotFoundException('File not found');

    const ext = extname(diskName).toLowerCase();
    const ct =
      ext === '.pdf'
        ? 'application/pdf'
        : ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : 'application/octet-stream';
    res.setHeader('Content-Type', ct);
    res.setHeader('Content-Disposition', `inline; filename="${diskName}"`);
    createReadStream(abs).pipe(res);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = ['image/jpeg', 'image/png', 'application/pdf'].includes(
          file.mimetype,
        );
        cb(null, ok);
      },
    }),
  )
  @Post('id-document')
  async submitIdDocument(
    @Req() req: { user: { userId: string } },
    @UploadedFile() file: MemoryUploadedFile | undefined,
    @Body() dto: SubmitIdDocumentBodyDto,
  ) {
    let fileUrl = dto.fileUrl?.trim() ?? '';
    if (file) {
      fileUrl = await this.idStorage.saveBuffer(file);
    }
    if (!fileUrl) {
      throw new BadRequestException('Provide a file upload or fileUrl');
    }
    return this.prisma.iDDocument.create({
      data: {
        userId: req.user.userId,
        type: dto.type,
        fileUrl,
        status: 'PENDING',
      },
    });
  }

  /** @deprecated Use POST /verification/id-document — trust is applied when admin approves. */
  @UseGuards(JwtAuthGuard)
  @Post('id')
  verifyIdLegacy(
    @Req() req: { user: { userId: string } },
    @Body() body: { fileUrl: string; type: string },
  ) {
    return this.service.applyEvent(
      req.user.userId,
      VerificationType.ID_UPLOAD,
      30,
      `ID verified (${body.type})`,
    );
  }
}
