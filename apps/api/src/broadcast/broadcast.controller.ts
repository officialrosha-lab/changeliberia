import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { StakeholderGroupService } from '../stakeholder-groups/stakeholder-group.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
    @Req() req: any,
  ) {
    if (!body.subject || !body.content) {
      throw new BadRequestException('subject and content are required');
    }

    return this.broadcastService.broadcastToGroup(
      groupId,
      body.subject,
      body.content,
      req.user.id,
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
    @Req() req: any,
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
      req.user.id,
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
    @Req() req: any,
  ) {
    if (!body.subject || !body.content) {
      throw new BadRequestException('subject and content are required');
    }

    return this.broadcastService.broadcastToPetitionStakeholders(
      petitionId,
      body.subject,
      body.content,
      req.user.id,
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
