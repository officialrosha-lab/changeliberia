import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '@prisma/client';
import { EndorsementsService } from './endorsements.service';
import { RejectEndorsementDto } from './dto';

interface AuthUser {
  userId: string;
}

@Controller('admin/endorsements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminEndorsementsController {
  constructor(private readonly service: EndorsementsService) {}

  @Get('pending')
  listPending() {
    return this.service.listPending();
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.approve(id, user.userId);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: RejectEndorsementDto) {
    return this.service.reject(id, user.userId, dto);
  }
}
