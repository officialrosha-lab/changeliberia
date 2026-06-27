import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionFingerprintService } from './session-fingerprint.service';
import { CastVoteDto } from './dto/vote.dto';
import { PollsGateway } from './polls.gateway';

@Injectable()
export class VotingService {
  constructor(
    private prisma: PrismaService,
    private fingerprintService: SessionFingerprintService,
    private pollsGateway?: PollsGateway,
  ) {}

  /**
   * Cast a vote for a poll option
   * Uses session fingerprinting for duplicate detection
   */
  async castVote(
    pollId: string,
    voteDto: CastVoteDto,
    ipAddress: string,
    userAgent: string,
    userId?: string,
  ) {
    // Verify poll exists and is active
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      throw new BadRequestException('Poll not found');
    }

    if (poll.status !== 'ACTIVE') {
      throw new BadRequestException('Poll is not active');
    }

    if (new Date() > poll.expiresAt) {
      throw new BadRequestException('Poll has expired');
    }

    // Verify option exists and belongs to this poll
    const option = poll.options.find((opt) => opt.id === voteDto.optionId);
    if (!option) {
      throw new BadRequestException('Option not found');
    }

    const fingerprint = this.fingerprintService.generateFingerprint(ipAddress, userAgent);
    // Authenticated users dedup by userId; anonymous users dedup by fingerprint
    const sessionId = userId ?? fingerprint;
    const ipHash = this.hashIP(ipAddress);

    // Rate limiting only applies to anonymous (fingerprint-based) votes
    if (!userId) {
      const isRateLimited = await this.fingerprintService.isRateLimited(fingerprint);
      if (isRateLimited) {
        throw new UnauthorizedException('Too many votes from this session. Please try again later.');
      }
    }

    // Check if this session/user already voted on this poll
    const existingVote = await this.prisma.pollVote.findUnique({
      where: { pollId_sessionId: { pollId, sessionId } },
    });

    if (existingVote) {
      throw new UnauthorizedException('You have already voted on this poll');
    }

    // Record the vote
    const vote = await this.prisma.pollVote.create({
      data: {
        pollId,
        optionId: voteDto.optionId,
        userId: userId ?? null,
        sessionId,   // userId for authenticated, fingerprint for anonymous
        ipHash,
        fingerprint, // always stored for audit
      },
    });

    // Update vote counts
    await this.prisma.pollOption.update({
      where: { id: voteDto.optionId },
      data: { voteCount: { increment: 1 } },
    });

    await this.prisma.poll.update({
      where: { id: pollId },
      data: { totalVotes: { increment: 1 } },
    });

    // Record fingerprint
    await this.fingerprintService.recordFingerprint(
      fingerprint,
      ipHash,
      userAgent,
    );

    // Broadcast updated results to WebSocket clients (if gateway is available)
    try {
      const updated = await this.prisma.poll.findUnique({
        where: { id: pollId },
        include: { options: true },
      });
      if (this.pollsGateway && updated) {
        this.pollsGateway.broadcastPollUpdate(pollId, {
          totalVotes: updated.totalVotes,
          options: updated.options.map(o => ({ id: o.id, voteCount: o.voteCount })),
        });
      }
    } catch (e) {
      // non-fatal: broadcasting failure should not block vote
    }
    return {
      success: true,
      message: 'Vote recorded successfully',
      voteId: vote.id,
    };
  }

  /**
   * Get recent votes for a poll (for moderation)
   */
  async getRecentVotes(pollId: string, limit: number = 20) {
    return this.prisma.pollVote.findMany({
      where: { pollId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        option: true,
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  /**
   * Check if a session has already voted
   */
  async hasSessionVoted(pollId: string, fingerprint: string): Promise<boolean> {
    const vote = await this.prisma.pollVote.findFirst({
      where: {
        pollId,
        fingerprint,
      },
    });
    return !!vote;
  }

  /**
   * Hash IP address for privacy
   */
  private hashIP(ipAddress: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16);
  }
}
