import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  AddMemberDto,
  CreateOrganizationDto,
  OrganizationsService,
  SubscribeOrganizationDto,
} from './organizations.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrganizationDto) {
    return this.organizations.createOrganization(user.userId, dto);
  }

  @Get('me')
  listMine(@CurrentUser() user: AuthUser) {
    return this.organizations.listMyOrganizations(user.userId);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.organizations.getOrganization(id, user.userId);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.organizations.addMember(id, user.userId, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.organizations.removeMember(id, user.userId, targetUserId);
  }

  @Patch(':id/members/:userId')
  updateMemberRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body() body: { role: OrganizationRole },
  ) {
    return this.organizations.updateMemberRole(
      id,
      user.userId,
      targetUserId,
      body.role,
    );
  }

  @Post(':id/subscribe')
  subscribe(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SubscribeOrganizationDto,
  ) {
    return this.organizations.subscribe(id, user.userId, dto);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.organizations.cancelSubscription(id, user.userId);
  }

  @Get(':id/subscription')
  async getSubscription(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    const subscription = await this.organizations.getSubscription(
      id,
      user.userId,
    );
    return { subscription };
  }
}
