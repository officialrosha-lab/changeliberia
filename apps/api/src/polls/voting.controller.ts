import {
  Controller,
  Post,
  Body,
  Param,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { VotingService } from './voting.service';
import { SessionFingerprintService } from './session-fingerprint.service';
import { CastVoteDto } from './dto/vote.dto';

@Controller('polls/:pollId/vote')
export class VotingController {
  constructor(
    private votingService: VotingService,
    private fingerprintService: SessionFingerprintService,
    private jwtService: JwtService,
  ) {}

  /**
   * POST /polls/:id/vote
   * Cast a vote on a poll option.
   * Dedup: authenticated users are deduped by userId; anonymous by IP fingerprint.
   */
  @Post()
  async castVote(
    @Param('pollId') pollId: string,
    @Body() voteDto: CastVoteDto,
    @Request() req: any,
  ) {
    if (!pollId || !voteDto.optionId) {
      throw new BadRequestException('Invalid poll or option ID');
    }

    const ipAddress = this.fingerprintService.extractRealIP(req);
    const userAgent = this.fingerprintService.extractUserAgent(req);

    let userId: string | undefined;
    const rawToken = (req.headers.authorization as string | undefined)?.replace('Bearer ', '');
    if (rawToken) {
      try {
        const payload = this.jwtService.verify<{ sub: string }>(rawToken);
        userId = payload.sub;
      } catch {}
    }

    return this.votingService.castVote(pollId, voteDto, ipAddress, userAgent, userId);
  }
}
