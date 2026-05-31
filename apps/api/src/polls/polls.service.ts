import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { PollResponse, PollListResponse } from './dto/poll-response.dto';
import { slugify } from '../common/utils/slugify';

@Injectable()
export class PollsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new poll (admin/verified users only)
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

    // Create poll with options
    const poll = await this.prisma.poll.create({
      data: {
        slug,
        title: createPollDto.title,
        description: createPollDto.description,
        category: createPollDto.category,
        county: createPollDto.county || null,
        createdBy,
        expiresAt: new Date(createPollDto.expiresAt),
        relatedPetitionIds: JSON.stringify(
          createPollDto.relatedPetitionIds || [],
        ),
        options: {
          create: createPollDto.options.map((text, index) => ({
            text,
            order: index + 1,
          })),
        },
      },
      include: {
        options: true,
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return this.formatPollResponse(poll);
  }

  /**
   * Get all active polls with filtering
   */
  async listPolls(
    category?: string,
    county?: string,
    status: string = 'ACTIVE',
    limit: number = 20,
    offset: number = 0,
  ): Promise<PollListResponse[]> {
    const polls = await this.prisma.poll.findMany({
      where: {
        status,
        visibility: 'PUBLIC',
        category: category ? { equals: category, mode: 'insensitive' } : undefined,
        county: county ? { equals: county, mode: 'insensitive' } : undefined,
      },
      orderBy: { createdAt: 'desc' },
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
    const poll = await this.prisma.poll.findUnique({
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
        status: 'ARCHIVED',
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
