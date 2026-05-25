import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CreateSignatureDto } from './dto';
import { SignaturesService } from './signatures.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';

@Controller('signatures')
export class SignaturesController {
  constructor(
    private readonly service: SignaturesService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':petitionId/has-signed')
  async hasSigned(
    @Param('petitionId') petitionId: string,
    @Req() req: { user?: { userId: string } },
  ) {
    if (!req.user?.userId) return { signed: false };
    const existing = await this.service.findByUserAndPetition(req.user.userId, petitionId);
    return { signed: !!existing };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async create(
    @Req()
    req: {
      user?: { userId: string };
      ip?: string;
      headers: Record<string, string>;
    },
    @Body() dto: CreateSignatureDto,
  ) {
    const ip = req.ip ?? req.headers['x-forwarded-for'] ?? 'unknown';
    const result = await this.service.create(req.user?.userId, String(ip), dto);
    
    // Log signature creation only if signature was actually created (not rejected by CAPTCHA)
    if (result.signature && req.user?.userId) {
      this.activityLogger.logAsync({
        userId: req.user.userId,
        action: 'CREATE_SIGNATURE',
        entityType: 'SIGNATURE',
        entityId: result.signature.id,
        description: `User signed petition: "${dto.petitionId}"`,
        changes: { petitionId: dto.petitionId },
      });
    }
    
    return result;
  }
}
