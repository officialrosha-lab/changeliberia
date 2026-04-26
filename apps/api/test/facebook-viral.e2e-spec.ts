import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { FacebookController } from '../src/facebook/facebook.controller';
import { BadgeController } from '../src/facebook/badge.controller';
import { ChallengeController } from '../src/facebook/challenge.controller';
import { FacebookService } from '../src/facebook/facebook.service';
import { BadgeService } from '../src/facebook/badge.service';
import { ChallengeService } from '../src/facebook/challenge.service';
import { FacebookPixelService } from '../src/facebook/facebook-pixel.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { EventBusService } from '../src/events/event-bus.service';

/**
 * Facebook Viral Growth System E2E Tests
 * Tests full workflow for shares, badges, and challenges
 */
describe('Facebook Viral Growth System (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: jest.Mocked<PrismaService>;
  let eventBusService: jest.Mocked<EventBusService>;

  const mockPetition = {
    id: 'petition-1',
    title: 'Test Petition',
    description: 'Test Description',
    summary: 'Test Summary',
    signaturesCount: 100,
    goal: 500,
    imageUrl: 'https://example.com/image.jpg',
    facebookShareCount: 0,
    creator: { id: 'creator-1', name: 'Creator' },
  };

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    trustScore: 75,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FacebookController, BadgeController, ChallengeController],
      providers: [
        FacebookService,
        BadgeService,
        ChallengeService,
        FacebookPixelService,
        {
          provide: PrismaService,
          useValue: {
            petition: {
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            shareLink: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
            },
            facebookPixelEvent: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            socialEngagementBadge: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              count: jest.fn(),
            },
            referral: {
              findMany: jest.fn(),
            },
            shareChallenge: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            challengeMembership: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            customAudience: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: EventBusService,
          useValue: {
            publish: jest.fn(),
            listen: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prismaService = moduleFixture.get(PrismaService) as jest.Mocked<PrismaService>;
    eventBusService = moduleFixture.get(EventBusService) as jest.Mocked<EventBusService>;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Facebook Share Workflow', () => {
    it('should get OG metadata for sharing', () => {
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);

      return request(app.getHttpServer())
        .get('/api/facebook/og-meta/petition-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('title');
          expect(res.body.data).toHaveProperty('description');
          expect(res.body.data).toHaveProperty('image');
          expect(res.body.data).toHaveProperty('url');
        });
    });

    it('should create a Facebook share link', () => {
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.shareLink.create.mockResolvedValue({
        id: 'share-1',
        shortCode: 'abc12345',
        targetUrl: 'https://changelib.org/petitions/petition-1',
        petitionId: 'petition-1',
        source: 'facebook',
        medium: 'social',
        campaign: 'user_share',
        shareDialogUsed: true,
        clickCount: 0,
        conversions: 0,
        networkReachEstimate: 250,
        lastClickedAt: null,
      } as any);

      return request(app.getHttpServer())
        .post('/api/facebook/share')
        .set('Authorization', 'Bearer test-token')
        .send({ petitionId: 'petition-1' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('shareUrl');
          expect(res.body.data).toHaveProperty('shortCode');
          expect(res.body.data).toHaveProperty('reachEstimate');
        });
    });

    it('should get share dialog configuration', () => {
      return request(app.getHttpServer())
        .get('/api/facebook/share-dialog/petition-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('quote');
          expect(res.body.data).toHaveProperty('hashtag');
          expect(res.body.data).toHaveProperty('link');
        });
    });

    it('should track a share click', () => {
      prismaService.shareLink.findUnique.mockResolvedValue({
        id: 'share-1',
        shortCode: 'abc12345',
        targetUrl: 'https://changelib.org/petitions/petition-1',
      } as any);
      prismaService.shareLink.update.mockResolvedValue({} as any);

      return request(app.getHttpServer())
        .post('/api/facebook/track/abc12345')
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('redirectUrl');
        });
    });
  });

  describe('Badge System', () => {
    it('should get all badge descriptions', () => {
      return request(app.getHttpServer())
        .get('/api/badges')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('badges');
          expect(res.body.data).toHaveProperty('count');
        });
    });

    it('should get user badges', () => {
      prismaService.socialEngagementBadge.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/badges/user/user-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('userId');
          expect(res.body.data).toHaveProperty('badges');
          expect(res.body.data).toHaveProperty('count');
        });
    });

    it('should get badge leaderboard', () => {
      prismaService.user.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/badges/leaderboard')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('leaderboard');
          expect(res.body.data).toHaveProperty('count');
          expect(res.body.data).toHaveProperty('period');
        });
    });

    it('should support custom limit on leaderboard', () => {
      prismaService.user.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/badges/leaderboard?limit=25')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Challenge System', () => {
    it('should get active challenges for petition', () => {
      prismaService.shareChallenge.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/challenges/active/petition-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('petitionId');
          expect(res.body.data).toHaveProperty('challenges');
          expect(res.body.data).toHaveProperty('count');
        });
    });

    it('should get user challenges', () => {
      prismaService.challengeMembership.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/challenges/user')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('userId');
          expect(res.body.data).toHaveProperty('challenges');
          expect(res.body.data).toHaveProperty('totalCount');
          expect(res.body.data).toHaveProperty('completedCount');
        });
    });

    it('should track challenge progress', () => {
      const mockChallenge = {
        id: 'challenge-1',
        goalValue: 10,
        rewardMultiplier: 2.0,
      };

      prismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge as any,
      );
      prismaService.challengeMembership.findUnique.mockResolvedValue(null);
      prismaService.challengeMembership.create.mockResolvedValue({
        userId: 'user-1',
        challengeId: 'challenge-1',
        progress: 1,
        completed: false,
      } as any);

      return request(app.getHttpServer())
        .post('/api/challenges/track-progress')
        .set('Authorization', 'Bearer test-token')
        .send({
          challengeId: 'challenge-1',
          increment: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('progress');
          expect(res.body.data).toHaveProperty('goalValue');
          expect(res.body.data).toHaveProperty('completed');
        });
    });

    it('should get challenge leaderboard', () => {
      const mockChallenge = { id: 'challenge-1', goalValue: 10 };
      prismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge as any,
      );
      prismaService.challengeMembership.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/challenges/challenge-1/leaderboard')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('challengeId');
          expect(res.body.data).toHaveProperty('leaderboard');
          expect(res.body.data).toHaveProperty('count');
        });
    });

    it('should get challenge history', () => {
      prismaService.challengeMembership.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/challenges/user/history')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('userId');
          expect(res.body.data).toHaveProperty('completedChallenges');
          expect(res.body.data).toHaveProperty('totalEarnings');
        });
    });
  });

  describe('Pixel Tracking', () => {
    it('should get pixel initialization code', () => {
      return request(app.getHttpServer())
        .get('/api/facebook/pixel')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('pixelId');
          expect(res.body.data).toHaveProperty('initCode');
        });
    });

    it('should get pixel analytics report', () => {
      prismaService.facebookPixelEvent.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/facebook/pixel-report')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('totalEvents');
          expect(res.body.data).toHaveProperty('eventsByType');
          expect(res.body.data).toHaveProperty('totalConversions');
          expect(res.body.data).toHaveProperty('conversionRate');
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent petition OG meta', () => {
      prismaService.petition.findUnique.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/api/facebook/og-meta/invalid')
        .expect(404);
    });

    it('should return 400 for missing petitionId in share creation', () => {
      return request(app.getHttpServer())
        .post('/api/facebook/share')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(400);
    });

    it('should return 400 for invalid increment in progress tracking', () => {
      return request(app.getHttpServer())
        .post('/api/challenges/track-progress')
        .set('Authorization', 'Bearer test-token')
        .send({
          challengeId: 'challenge-1',
          increment: 0,
        })
        .expect(400);
    });

    it('should return 400 for missing challengeId', () => {
      return request(app.getHttpServer())
        .get('/api/challenges/active/')
        .expect(400);
    });
  });

  describe('Event Publishing', () => {
    it('should publish event on share creation', () => {
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.shareLink.create.mockResolvedValue({
        id: 'share-1',
        shortCode: 'abc12345',
      } as any);

      return request(app.getHttpServer())
        .post('/api/facebook/share')
        .set('Authorization', 'Bearer test-token')
        .send({ petitionId: 'petition-1' })
        .expect(201)
        .expect(() => {
          expect(eventBusService.publish).toHaveBeenCalled();
        });
    });
  });
});
