import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { StakeholderGroupService } from '../stakeholder-groups/stakeholder-group.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/roles.guard';

@Controller('admin/broadcast')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BroadcastController {
  constructor(
    private broadcastService: BroadcastService,
    private stakeholderGroupService: StakeholderGroupService,
  ) {}

  /**
   * Send a broadcast message to a specific stakeholder group
   */
  @Post('group/:groupId')
  @HttpCode(HttpStatus.OK)
  async broadcastToGroup(
    @Param('groupId') groupId: string,
    @Body()
    body: {
      subject: string;
      content: string;
      category?: string;
    },
    @CurrentUser() user: RequestUser,
  ) {
    if (!body.subject || !body.content) {
      throw new BadRequestException('subject and content are required');
    }

    return this.broadcastService.broadcastToGroup(
      groupId,
      body.subject,
      body.content,
      user.userId,
      body.category,
    );
  }

  /**
   * Send a broadcast to multiple groups
   */
  @Post('groups/batch')
  @HttpCode(HttpStatus.OK)
  async broadcastToMultipleGroups(
    @Body()
    body: {
      groupIds: string[];
      subject: string;
      content: string;
      category?: string;
    },
    @CurrentUser() user: RequestUser,
  ) {
    if (!body.groupIds || !Array.isArray(body.groupIds)) {
      throw new BadRequestException('groupIds must be an array');
    }

    if (!body.subject || !body.content) {
      throw new BadRequestException('subject and content are required');
    }

    return this.broadcastService.broadcastToMultipleGroups(
      body.groupIds,
      body.subject,
      body.content,
      user.userId,
      body.category,
    );
  }

  /**
   * Send a broadcast to all stakeholder groups of a petition
   */
  @Post('petition/:petitionId')
  @HttpCode(HttpStatus.OK)
  async broadcastToPetitionStakeholders(
    @Param('petitionId') petitionId: string,
    @Body()
    body: {
      subject: string;
      content: string;
      excludeGroupTypes?: string[];
      category?: string;
    },
    @CurrentUser() user: RequestUser,
  ) {
    if (!body.subject || !body.content) {
      throw new BadRequestException('subject and content are required');
    }

    return this.broadcastService.broadcastToPetitionStakeholders(
      petitionId,
      body.subject,
      body.content,
      user.userId,
      body.excludeGroupTypes,
      body.category,
    );
  }

  /**
   * Get broadcast history for a group
   */
  @Get('group/:groupId/history')
  async getBroadcastHistory(
    @Param('groupId') groupId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    return this.broadcastService.getBroadcastHistory(
      groupId,
      skip,
      parseInt(pageSize),
    );
  }

  /**
   * Get broadcast stats for a petition
   */
  @Get('petition/:petitionId/stats')
  async getPetitionBroadcastStats(@Param('petitionId') petitionId: string) {
    return this.broadcastService.getPetitionBroadcastStats(petitionId);
  }
}
