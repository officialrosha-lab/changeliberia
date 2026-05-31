import { Module } from '@nestjs/common';
import { PollsService } from './polls.service';
import { VotingService } from './voting.service';
import { SessionFingerprintService } from './session-fingerprint.service';
import { PollsController } from './polls.controller';
import { VotingController } from './voting.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PollsGateway } from './polls.gateway';

@Module({
  imports: [],
  controllers: [PollsController, VotingController],
  providers: [
    PollsService,
    VotingService,
    SessionFingerprintService,
    PollsGateway,
    PrismaService,
  ],
  exports: [PollsService, VotingService, SessionFingerprintService, PollsGateway],
})
export class PollsModule {}
