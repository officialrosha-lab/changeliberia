import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  ServiceRequestsService,
  SubmitServiceRequestDto,
} from './service-requests.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('service-requests')
@UseGuards(JwtAuthGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequests: ServiceRequestsService) {}

  @Post()
  submit(@CurrentUser() user: AuthUser, @Body() dto: SubmitServiceRequestDto) {
    return this.serviceRequests.submit(user.userId, dto);
  }

  @Get('me')
  listMine(@CurrentUser() user: AuthUser) {
    return this.serviceRequests.listMine(user.userId);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.serviceRequests.get(id, user.userId, user.role === 'ADMIN');
  }
}
