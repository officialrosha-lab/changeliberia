import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { VotingController } from './voting.controller';
import { VotingService } from './voting.service';
import { SessionFingerprintService } from './session-fingerprint.service';

describe('VotingController (unit)', () => {
  let app: INestApplication;
  let votingService: jest.Mocked<VotingService>;
  let fingerprintService: jest.Mocked<SessionFingerprintService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotingController],
      providers: [
        {
          provide: VotingService,
          useValue: { castVote: jest.fn() },
        },
        {
          provide: SessionFingerprintService,
          useValue: {
            extractRealIP: jest.fn().mockReturnValue('127.0.0.1'),
            extractUserAgent: jest.fn().mockReturnValue('jest-agent'),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    votingService = module.get(VotingService) as jest.Mocked<VotingService>;
    fingerprintService = module.get(
      SessionFingerprintService,
    ) as jest.Mocked<SessionFingerprintService>;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 400 for missing optionId', () => {
    return request(app.getHttpServer())
      .post('/polls/poll-1/vote')
      .send({})
      .expect(400);
  });

  it('calls VotingService.castVote and returns result', () => {
    votingService.castVote.mockResolvedValueOnce({ success: true, message: 'OK', voteId: 'v1' });

    return request(app.getHttpServer())
      .post('/polls/poll-1/vote')
      .send({ optionId: 'opt-1' })
      .expect(201)
      .expect((res) => {
        expect(votingService.castVote).toHaveBeenCalled();
        expect(res.body.success).toBe(true);
        expect(res.body.voteId).toBe('v1');
      });
  });
});
