import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CreateSignatureDto } from './dto';
import { SignaturesService } from './signatures.service';

@Controller('signatures')
export class SignaturesController {
  constructor(private readonly service: SignaturesService) {}

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
  create(
    @Req()
    req: {
      user?: { userId: string };
      ip?: string;
      headers: Record<string, string>;
    },
    @Body() dto: CreateSignatureDto,
  ) {
    const ip = req.ip ?? req.headers['x-forwarded-for'] ?? 'unknown';
    return this.service.create(req.user?.userId, String(ip), dto);
  }
}
