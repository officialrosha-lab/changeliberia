import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Institution } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUser } from '../auth/roles.guard';
import {
  OfficialAccess,
  OfficialOwnershipGuard,
} from '../officials/guards/official-ownership.guard';
import {
  InstitutionSubscriptionsService,
  SubscribeInstitutionDto,
} from './institution-subscriptions.service';

interface OfficialRequest extends Request {
  user?: RequestUser;
  officialInstitution?: Institution;
  officialAccess?: OfficialAccess;
}

@Controller('institutions/:institutionId')
@UseGuards(JwtAuthGuard, OfficialOwnershipGuard)
export class InstitutionSubscriptionsController {
  constructor(
    private readonly institutionSubscriptions: InstitutionSubscriptionsService,
  ) {}

  @Get('subscription')
  async getSubscription(@Param('institutionId') institutionId: string) {
    const subscription =
      await this.institutionSubscriptions.getSubscription(institutionId);
    return { subscription };
  }

  @Post('subscribe')
  subscribe(
    @Req() req: OfficialRequest,
    @Param('institutionId') institutionId: string,
    @Body() dto: SubscribeInstitutionDto,
  ) {
    const userId = req.user!.userId;
    const isOfficeholder = req.officialAccess?.isOfficeholder ?? false;
    return this.institutionSubscriptions.subscribe(
      institutionId,
      userId,
      isOfficeholder,
      dto,
    );
  }

  @Post('cancel')
  cancel(
    @Req() req: OfficialRequest,
    @Param('institutionId') institutionId: string,
  ) {
    const userId = req.user!.userId;
    const isOfficeholder = req.officialAccess?.isOfficeholder ?? false;
    return this.institutionSubscriptions.cancelSubscription(
      institutionId,
      userId,
      isOfficeholder,
    );
  }
}
