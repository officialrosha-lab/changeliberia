import {
  Controller,
  Post,
  Get,
  Delete,
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
import { StakeholderGroupService } from './stakeholder-group.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/stakeholder-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class StakeholderGroupController {
  constructor(private stakeholderGroupService: StakeholderGroupService) {}

  /**
   * Get all stakeholder groups for a petition
   */
  @Get('petition/:petitionId')
  async getPetitionGroups(@Param('petitionId') petitionId: string) {
    const groups =
      await this.stakeholderGroupService.getPetitionGroups(petitionId);

    if (!groups || groups.length === 0) {
      throw new NotFoundException(
        'No stakeholder groups found for this petition',
      );
    }

    return {
      petitionId,
      groups: groups.map((g) => ({
        id: g.id,
        groupType: g.groupType,
        memberCount: g.memberships.length,
        createdAt: g.createdAt,
      })),
    };
  }

  /**
   * Get a specific group with all its members
   */
  @Get('group/:groupId/members')
  async getGroupMembers(
    @Param('groupId') groupId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    return this.stakeholderGroupService.listGroupMembers(
      groupId,
      skip,
      parseInt(pageSize),
    );
  }

  /**
   * Get group member counts for a petition (summary)
   */
  @Get('petition/:petitionId/summary')
  async getGroupMemberCounts(@Param('petitionId') petitionId: string) {
    const counts =
      await this.stakeholderGroupService.getGroupMemberCounts(petitionId);
    return {
      petitionId,
      memberCounts: counts,
      totalStakeholders: Object.values(counts).reduce(
        (sum: any, count: any) => sum + count,
        0,
      ),
    };
  }

  /**
   * Add a single member to a group
   */
  @Post('group/:groupId/members')
  @HttpCode(HttpStatus.CREATED)
  async addMemberToGroup(
    @Param('groupId') groupId: string,
    @Body() body: { userId: string },
  ) {
    if (!body.userId) {
      throw new BadRequestException('userId is required');
    }

    return this.stakeholderGroupService.addMember(groupId, body.userId);
  }

  /**
   * Add multiple members to a group
   */
  @Post('group/:groupId/members/bulk')
  @HttpCode(HttpStatus.CREATED)
  async addMultipleMembersToGroup(
    @Param('groupId') groupId: string,
    @Body() body: { userIds: string[] },
  ) {
    if (!body.userIds || !Array.isArray(body.userIds)) {
      throw new BadRequestException('userIds must be an array');
    }

    return this.stakeholderGroupService.addMultipleMembers(
      groupId,
      body.userIds,
    );
  }

  /**
   * Remove a member from a group
   */
  @Delete('group/:groupId/members/:userId')
  @HttpCode(HttpStatus.OK)
  async removeMemberFromGroup(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.stakeholderGroupService.removeMember(groupId, userId);
  }

  /**
   * Check if a user is a member of a group
   */
  @Get('group/:groupId/members/:userId/check')
  async checkMembership(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    const isMember = await this.stakeholderGroupService.isMember(
      groupId,
      userId,
    );
    return { groupId, userId, isMember };
  }
}
