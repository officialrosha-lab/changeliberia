import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PollsService } from './polls.service';
import { VotingService } from './voting.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { SessionFingerprintService } from './session-fingerprint.service';

@Controller('polls')
export class PollsController {
  constructor(
    private pollsService: PollsService,
    private votingService: VotingService,
    private fingerprintService: SessionFingerprintService,
  ) {}

  /**
   * POST /polls
   * Create a new poll (admin direct creation = ACTIVE status)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createPoll(@Body() createPollDto: CreatePollDto, @Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('Authentication required');
    }

    return this.pollsService.createPoll(createPollDto, req.user.id);
  }

  /**
   * POST /polls/submit
   * Submit a poll idea (any authenticated user = PENDING status, awaiting admin approval)
   */
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submitPoll(@Body() createPollDto: CreatePollDto, @Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('Authentication required');
    }

    return this.pollsService.submitPoll(createPollDto, req.user.id);
  }

  /**
   * POST /polls/:id/approve
   * Approve a pending poll (admin only)
   */
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async approvePoll(@Param('id') pollId: string) {
    return this.pollsService.approvePoll(pollId);
  }

  /**
   * POST /polls/:id/reject
   * Reject a pending poll (admin only)
   */
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async rejectPoll(@Param('id') pollId: string, @Body('reason') reason?: string) {
    return this.pollsService.rejectPoll(pollId, reason);
  }

  /**
   * GET /polls
   * List all active polls with optional filtering
   */
  @Get()
  async listPolls(
    @Query('category') category?: string,
    @Query('county') county?: string,
    @Query('status') status: string = 'ACTIVE',
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
  ) {
    return this.pollsService.listPolls(category, county, status, limit, offset, sort, search);
  }

  /**
   * GET /polls/trending
   * Get trending polls by vote count
   */
  @Get('trending')
  async getTrendingPolls(@Query('limit') limit: number = 5) {
    return this.pollsService.getTrendingPolls(limit);
  }

  /**
   * GET /polls/slug/:slug
   * Get a single poll by public slug
   */
  @Get('slug/:slug')
  async getPollBySlug(@Param('slug') slug: string) {
    return this.pollsService.getPollBySlug(slug);
  }

  /**
   * GET /polls/:id/results
   * Get detailed poll results with percentages
   */
  @Get(':id/results')
  async getPollResults(@Param('id') pollId: string) {
    return this.pollsService.getPollResults(pollId);
  }

  /**
   * GET /polls/:id
   * Get a single poll with options and vote counts
   */
  @Get(':id')
  async getPoll(@Param('id') pollId: string) {
    return this.pollsService.getPoll(pollId);
  }

  /**
   * GET /polls/:id/geographic-breakdown
   * Petition Location Verification & Impact Area System (Phase 2) —
   * geographic participation breakdown (aggregate-only).
   */
  @Get(':id/geographic-breakdown')
  async getGeographicBreakdown(@Param('id') pollId: string) {
    return this.pollsService.getGeographicBreakdown(pollId);
  }

  /**
   * DELETE /polls/:id
   * Archive a poll (admin only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async archivePoll(@Param('id') pollId: string, @Request() req: any) {
    await this.pollsService.archivePoll(pollId);
    return { success: true, message: 'Poll archived' };
  }
}
