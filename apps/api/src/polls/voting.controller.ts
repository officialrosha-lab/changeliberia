import {
  Controller,
  Post,
  Body,
  Param,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { VotingService } from './voting.service';
import { SessionFingerprintService } from './session-fingerprint.service';
import { CastVoteDto } from './dto/vote.dto';

@Controller('polls/:pollId/vote')
export class VotingController {
  constructor(
    private votingService: VotingService,
    private fingerprintService: SessionFingerprintService,
  ) {}

  /**
   * POST /polls/:id/vote
   * Cast a vote on a poll option
   * Anti-spam: Uses session fingerprinting to prevent duplicate votes
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

    // Extract IP address and user agent
    const ipAddress = this.fingerprintService.extractRealIP(req);
    const userAgent = this.fingerprintService.extractUserAgent(req);

    // Cast the vote (with anti-spam checks)
    return this.votingService.castVote(
      pollId,
      voteDto,
      ipAddress,
      userAgent,
    );
  }
}
