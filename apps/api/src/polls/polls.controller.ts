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
   * Create a new poll (admin/verified users only)
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
  ) {
    return this.pollsService.listPolls(category, county, status, limit, offset);
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
