import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FraudService } from './fraud.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('fraud')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get('rules')
  rules() {
    return this.fraudService.listRules();
  }

  @Patch('rules/:key')
  updateRule(
    @Param('key') key: string,
    @Body() body: { threshold?: number; penalty?: number; enabled?: boolean },
  ) {
    return this.fraudService.updateRule(key, body);
  }

  @Get('analytics')
  analytics() {
    return this.fraudService.getAnalytics();
  }

  @Post('jobs/anomaly-scan')
  enqueueAnomalyScan() {
    return this.fraudService.enqueueAnomalyScan('manual');
  }

  @Post('jobs/process-next')
  processNextJob() {
    return this.fraudService.processNextQueuedJob();
  }

  @Get('metrics')
  metrics() {
    return this.fraudService.getMetrics();
  }
}
