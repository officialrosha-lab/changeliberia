import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PollsModule } from './polls.module';
import { PrismaService } from '../prisma/prisma.service';

interface TestPoll {
  id: string;
  slug: string;
  optionIds: string[];
}

describe('Voting API integration', () => {
  jest.setTimeout(300000);

  let app: INestApplication | null = null;
  let prisma: PrismaService | null = null;
  let authorId: string;
  const polls: TestPoll[] = [];
  const testIpHeaders = {
    'user-agent': 'integration-test-agent',
    'x-forwarded-for': '203.0.113.123',
  };

  beforeAll(async () => {
    console.log('voting.e2e.spec.ts beforeAll: creating module fixture');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PollsModule],
    }).compile();

    console.log('voting.e2e.spec.ts beforeAll: module fixture created');
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    console.log('voting.e2e.spec.ts beforeAll: initializing app');
    await app.init();
    console.log('voting.e2e.spec.ts beforeAll: app initialized');

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    const author = await prisma.user.create({
      data: {
        phone: `+1501555${Date.now().toString().slice(-6)}`,
        fullName: 'Integration Author',
      },
    });
    authorId = author.id;

    for (let index = 0; index < 11; index += 1) {
      const poll = await prisma.poll.create({
        data: {
          slug: `integration-poll-${Date.now()}-${index}`,
          title: `Integration Poll ${index}`,
          description: 'Integration test poll',
          category: 'civic',
          visibility: 'PUBLIC',
          status: 'ACTIVE',
          county: 'Montserrado',
          createdBy: author.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          relatedPetitionIds: '[]',
          options: {
            create: [
              { text: 'Yes', order: 1 },
              { text: 'No', order: 2 },
            ],
          },
        },
        include: {
          options: true,
        },
      });

      polls.push({
        id: poll.id,
        slug: poll.slug,
        optionIds: poll.options.map((option) => option.id),
      });
    }
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.pollVote.deleteMany({
        where: { pollId: { in: polls.map((p) => p.id) } },
      });
      await prisma.pollOption.deleteMany({
        where: { pollId: { in: polls.map((p) => p.id) } },
      });
      await prisma.poll.deleteMany({
        where: { id: { in: polls.map((p) => p.id) } },
      });
      if (authorId) {
        await prisma.user.deleteMany({
          where: { id: authorId },
        });
      }
    }
    if (app) {
      await app.close();
    }
  });

  it('accepts a vote, rejects duplicate votes, and enforces fingerprint rate limiting', async () => {
    const firstPoll = polls[0];
    const secondPoll = polls[10];

    const firstResponse = await request(app!.getHttpServer())
      .post(`/polls/${firstPoll.id}/vote`)
      .set(testIpHeaders)
      .send({ optionId: firstPoll.optionIds[0] })
      .expect(201);

    expect(firstResponse.body.success).toBe(true);
    expect(firstResponse.body.voteId).toBeDefined();

    const firstPollAfter = await prisma!.poll.findUnique({
      where: { id: firstPoll.id },
      include: { options: true },
    });

    expect(firstPollAfter?.totalVotes).toBe(1);
    expect(
      firstPollAfter?.options.find((opt) => opt.id === firstPoll.optionIds[0])?.voteCount,
    ).toBe(1);

    await request(app!.getHttpServer())
      .post(`/polls/${firstPoll.id}/vote`)
      .set(testIpHeaders)
      .send({ optionId: firstPoll.optionIds[0] })
      .expect(401);

    for (let index = 1; index < 10; index += 1) {
      const poll = polls[index];
      await request(app!.getHttpServer())
        .post(`/polls/${poll.id}/vote`)
        .set(testIpHeaders)
        .send({ optionId: poll.optionIds[0] })
        .expect(201);
    }

    await request(app!.getHttpServer())
      .post(`/polls/${secondPoll.id}/vote`)
      .set(testIpHeaders)
      .send({ optionId: secondPoll.optionIds[0] })
      .expect(401);
  });

  it('returns a poll by slug', async () => {
    const poll = polls[0];
    const response = await request(app!.getHttpServer())
      .get(`/polls/slug/${poll.slug}`)
      .expect(200);

    expect(response.body.id).toBe(poll.id);
    expect(response.body.slug).toBe(poll.slug);
  });
});
