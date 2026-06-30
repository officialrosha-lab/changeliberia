import { Injectable, BadRequestException, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { PollResponse, PollListResponse } from './dto/poll-response.dto';
import { slugify } from '../common/utils/slugify';

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Helper method to format poll options for database insertion
   */
  private formatPollOptions(options: { text: string; imageUrl?: string }[]) {
    return options.map((option, index) => ({
      text: option.text,
      imageUrl: option.imageUrl || undefined,
      order: index + 1,
    }));
  }

  /**
   * Create a new poll - admin direct creation (status = ACTIVE)
   */
  async createPoll(createPollDto: CreatePollDto, createdBy: string) {
    // Validate options
    if (!createPollDto.options || createPollDto.options.length < 2) {
      throw new BadRequestException(
        'Poll must have at least 2 options',
      );
    }

    // Generate slug
    const baseSlug = slugify(createPollDto.title);
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (
      await this.prisma.poll.findUnique({ where: { slug } })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create poll with options (admin direct creation = ACTIVE status)
    const poll = await this.prisma.poll.create({
      data: {
        slug,
        title: createPollDto.title,
        description: createPollDto.description,
        category: createPollDto.category,
        county: createPollDto.county || null,
        createdBy,
        status: 'ACTIVE', // Admin direct creation is immediately active
        expiresAt: new Date(createPollDto.expiresAt),
        relatedPetitionIds: JSON.stringify(
          createPollDto.relatedPetitionIds || [],
        ),
        options: {
          create: this.formatPollOptions(createPollDto.options),
        },
      },
      include: {
        options: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return this.formatPollResponse(poll);
  }

  /**
   * Submit a poll idea - user submission (status = PENDING, awaiting admin approval)
   */
  async submitPoll(createPollDto: CreatePollDto, submittedBy: string) {
    // Validate options
    if (!createPollDto.options || createPollDto.options.length < 2) {
      throw new BadRequestException('Poll must have at least 2 options');
    }

    try {
      // Generate slug
      const baseSlug = slugify(createPollDto.title);
      let slug = baseSlug;
      let counter = 1;

      // Ensure unique slug
      while (await this.prisma.poll.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create poll with PENDING status
      const poll = await this.prisma.poll.create({
        data: {
          slug,
          title: createPollDto.title,
          description: createPollDto.description,
          category: createPollDto.category,
          county: createPollDto.county || null,
          createdBy: submittedBy,
          status: 'PENDING' as any,
          expiresAt: new Date(createPollDto.expiresAt),
          relatedPetitionIds: JSON.stringify(createPollDto.relatedPetitionIds || []),
          options: {
            create: this.formatPollOptions(createPollDto.options),
          },
        },
        include: {
          options: true,
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // Notify admins of new pending poll
      this.eventEmitter.emit('poll.submitted', {
        pollId: poll.id,
        pollTitle: poll.title,
        submittedBy,
      });

      return this.formatPollResponse(poll);
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      // Surface Prisma error codes to help diagnose production issues
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`Poll submit Prisma error P${err.code}: ${err.message}`, err.meta);
        if (err.code === 'P2002') {
          throw new BadRequestException('A poll with that title already exists. Please use a different title.');
        }
        throw new InternalServerErrorException(`Database error: ${err.code} — ${err.message}`);
      }
      if (err instanceof Prisma.PrismaClientValidationError) {
        this.logger.error(`Poll submit validation error: ${err.message}`);
        throw new InternalServerErrorException(`Validation error: ${err.message}`);
      }
      this.logger.error(`Poll submit unexpected error: ${err}`);
      throw new InternalServerErrorException(`Unexpected error: ${String(err)}`);
    }
  }

  /**
   * Approve a pending poll (admin only)
   */
  async approvePoll(pollId: string): Promise<PollResponse> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.status !== 'PENDING') {
      throw new BadRequestException('Only pending polls can be approved');
    }

    // Update poll status to ACTIVE (approved = immediately live and voteable)
    const approvedPoll = await this.prisma.poll.update({
      where: { id: pollId },
      data: {
        status: 'ACTIVE',
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Emit approval event for email notification
    this.eventEmitter.emit('poll.approved', {
      pollId: approvedPoll.id,
      pollSlug: approvedPoll.slug,
      pollTitle: approvedPoll.title,
      creatorId: approvedPoll.creator.id,
      creatorEmail: approvedPoll.creator.email,
      creatorName: approvedPoll.creator.fullName,
      pollUrl: `/civic-pulse/${approvedPoll.slug}`,
    });

    return this.formatPollResponse(approvedPoll);
  }

  /**
   * Reject a pending poll (admin only)
   */
  async rejectPoll(pollId: string, reason?: string): Promise<PollResponse> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.status !== 'PENDING') {
      throw new BadRequestException('Only pending polls can be rejected');
    }

    // Update poll status to REJECTED
    const rejectedPoll = await this.prisma.poll.update({
      where: { id: pollId },
      data: {
        status: 'REJECTED',
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Emit rejection event for email notification
    this.eventEmitter.emit('poll.rejected', {
      pollId: rejectedPoll.id,
      pollTitle: rejectedPoll.title,
      creatorId: rejectedPoll.creator.id,
      creatorEmail: rejectedPoll.creator.email,
      creatorName: rejectedPoll.creator.fullName,
      reason: reason || 'Your poll idea was not approved at this time.',
    });

    return this.formatPollResponse(rejectedPoll);
  }

  /**
   * Get all active polls with filtering
   */
  async listPolls(
    category?: string,
    county?: string,
    status: string = 'APPROVED',
    limit: number = 20,
    offset: number = 0,
    sort?: string,
    search?: string,
  ): Promise<PollListResponse[]> {
    // Validate status is a valid PollStatus
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED', 'CLOSED'];
    const finalStatus = validStatuses.includes(status) ? (status as any) : 'APPROVED';

    const orderBy =
      sort === 'popular' ? { totalVotes: 'desc' as const } :
      sort === 'name'    ? { title: 'asc' as const } :
                           { createdAt: 'desc' as const };

    const polls = await this.prisma.poll.findMany({
      where: {
        status: finalStatus,
        visibility: 'PUBLIC',
        category: category ? { equals: category, mode: 'insensitive' } : undefined,
        county: county ? { equals: county, mode: 'insensitive' } : undefined,
        ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        county: true,
        status: true,
        totalVotes: true,
        expiresAt: true,
      },
    });

    return polls.map(poll => ({
      ...poll,
      expiresAt: poll.expiresAt.toISOString(),
    }));
  }

  /**
   * Get trending polls (by vote count)
   */
  async getTrendingPolls(limit: number = 5): Promise<PollListResponse[]> {
    const polls = await this.prisma.poll.findMany({
      where: {
        status: 'ACTIVE',
        visibility: 'PUBLIC',
      },
      orderBy: { totalVotes: 'desc' },
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        county: true,
        status: true,
        totalVotes: true,
        expiresAt: true,
      },
    });

    return polls.map(poll => ({
      ...poll,
      expiresAt: poll.expiresAt.toISOString(),
    }));
  }

  /**
   * Get a single poll with results
   */
  async getPoll(pollId: string): Promise<PollResponse> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    return this.formatPollResponse(poll);
  }

  /**
   * Get poll by slug
   */
  async getPollBySlug(slug: string): Promise<PollResponse> {
    try {
      const poll = await this.prisma.poll.findFirst({
        where: { slug },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
          creator: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      if (!poll) {
        throw new NotFoundException('Poll not found');
      }

      return this.formatPollResponse(poll);
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`getPollBySlug Prisma error P${err.code}: ${err.message}`, err.meta);
        throw new InternalServerErrorException(`Database error: ${err.code} — ${err.message}`);
      }
      if (err instanceof Prisma.PrismaClientValidationError) {
        this.logger.error(`getPollBySlug validation error: ${err.message}`);
        throw new InternalServerErrorException(`Validation error: ${err.message}`);
      }
      this.logger.error(`getPollBySlug unexpected error: ${err}`);
      throw new InternalServerErrorException(`Unexpected error: ${String(err)}`);
    }
  }

  /**
   * Get poll results with detailed statistics
   */
  async getPollResults(pollId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    return {
      id: poll.id,
      title: poll.title,
      totalVotes: poll.totalVotes,
      status: poll.status,
      expiresAt: poll.expiresAt,
      options: poll.options.map((option) => ({
        id: option.id,
        text: option.text,
        imageUrl: option.imageUrl ?? undefined,
        voteCount: option.voteCount,
        percentage: poll.totalVotes > 0
          ? Math.round((option.voteCount / poll.totalVotes) * 100)
          : 0,
      })),
    };
  }

  /**
   * Archive/close a poll (admin only)
   */
  async archivePoll(pollId: string): Promise<void> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    await this.prisma.poll.update({
      where: { id: pollId },
      data: {
        status: 'CLOSED',
        visibility: 'ARCHIVED',
      },
    });
  }

  /**
   * Get polls for a specific petition (related polls)
   */
  async getPollsForPetition(petitionId: string): Promise<PollListResponse[]> {
    const polls = await this.prisma.poll.findMany({
      where: {
        relatedPetitionIds: {
          contains: petitionId,
        },
        status: 'ACTIVE',
        visibility: 'PUBLIC',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        county: true,
        status: true,
        totalVotes: true,
        expiresAt: true,
      },
    });

    return polls.map(poll => ({
      ...poll,
      expiresAt: poll.expiresAt.toISOString(),
    }));
  }

  /**
   * Format poll response with calculated percentages
   */
  private formatPollResponse(poll: any): PollResponse {
    const relatedPetitionIds = Array.isArray(poll.relatedPetitionIds)
      ? poll.relatedPetitionIds
      : JSON.parse(poll.relatedPetitionIds || '[]');

    return {
      id: poll.id,
      slug: poll.slug,
      title: poll.title,
      description: poll.description,
      category: poll.category,
      county: poll.county,
      status: poll.status,
      visibility: poll.visibility,
      expiresAt: poll.expiresAt.toISOString(),
      totalVotes: poll.totalVotes,
      relatedPetitionIds,
      options: poll.options.map((option) => ({
        id: option.id,
        text: option.text,
        imageUrl: option.imageUrl ?? undefined,
        voteCount: option.voteCount,
        percentage: poll.totalVotes > 0
          ? Math.round((option.voteCount / poll.totalVotes) * 100)
          : 0,
      })),
      createdAt: poll.createdAt.toISOString(),
      createdBy: poll.creator,
    };
  }
}
