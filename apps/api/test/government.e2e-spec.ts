import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GovernmentController } from '../src/government/government.controller';
import { GovernmentService } from '../src/government/government.service';
import { PrismaService } from '../src/prisma/prisma.service';

jest.setTimeout(300000);

describe('Government API Endpoints (e2e)', () => {
  let app: INestApplication;
  let governmentService: GovernmentService;
  let prismaService: PrismaService;
  let userToken: string;
  let adminToken: string;
  let testPetitionId: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    governmentService = moduleFixture.get<GovernmentService>(GovernmentService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Create test users and data
    await setupTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================================
  // SETUP & HELPER FUNCTIONS
  // ============================================================================

  function decodeJwtSubject(token: string) {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')).sub;
  }

  async function setupTestData() {
    // Create regular user
    const userResponse = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'testuser@example.com',
        phone: '+231770000001',
        fullName: 'Test User',
      });
    console.log('signup user response', userResponse.status, JSON.stringify(userResponse.body));
    if (!userResponse.body?.accessToken) {
      throw new Error(`Signup user failed: status=${userResponse.status}, body=${JSON.stringify(userResponse.body)}`);
    }
    userToken = userResponse.body.accessToken;
    testUserId = decodeJwtSubject(userToken);

    await prismaService.user.update({
      where: { phone: '+231770000001' },
      data: { role: 'USER' },
    });

    await prismaService.verificationLog.create({
      data: {
        userId: testUserId,
        type: 'OTP',
        delta: 0,
        details: 'Test phone verification',
      },
    });

    // Create admin user
    const adminResponse = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'admin@example.com',
        phone: '+231770000002',
        fullName: 'Admin User',
      });
    console.log('signup admin response', adminResponse.status, JSON.stringify(adminResponse.body));
    if (!adminResponse.body?.accessToken) {
      throw new Error(`Signup admin failed: status=${adminResponse.status}, body=${JSON.stringify(adminResponse.body)}`);
    }
    adminToken = adminResponse.body.accessToken;

    // Set admin role
    await prismaService.user.update({
      where: { email: 'admin@example.com' },
      data: { role: 'ADMIN' },
    });

    // Create test petition with 1000+ signatures
    const petitionResponse = await request(app.getHttpServer())
      .post('/api/petitions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Fix Freetown Road Infrastructure',
        summary: 'An urgent petition to repair and upgrade the main road network in Freetown.',
        description: 'We need urgent repairs to critical road infrastructure across Freetown to ensure safe travel and economic activity.',
        goal: 5000,
        category: 'Infrastructure',
        tags: ['roads', 'infrastructure', 'safety'],
      });
    console.log('petition create response', petitionResponse.status, JSON.stringify(petitionResponse.body));
    if (!petitionResponse.body?.id) {
      throw new Error(`Petition creation failed: status=${petitionResponse.status}, body=${JSON.stringify(petitionResponse.body)}`);
    }

    testPetitionId = petitionResponse.body.id;

    // Add 1000+ signatures to petition
    for (let i = 0; i < 1050; i++) {
      await prismaService.signature.create({
        data: {
          petitionId: testPetitionId,
          name: `Signer ${i}`,
          anonymous: false,
        },
      });
    }

    // Ensure petition signaturesCount is accurate for business rules
    await prismaService.petition.update({
      where: { id: testPetitionId },
      data: { signaturesCount: 1050 },
    });

    // Create government contacts
    await prismaService.governmentContact.createMany({
      data: [
        {
          name: 'Ministry of Public Works',
          email: 'minister.works@liberia.gov.lr',
          phone: '+231-777-123456',
          category: 'MINISTRY',
          region: 'MONTSERRADO',
          priority: 1,
        },
        {
          name: 'Ministry of Health',
          email: 'minister.health@liberia.gov.lr',
          phone: '+231-777-654321',
          category: 'MINISTRY',
          region: 'MONTSERRADO',
          priority: 2,
        },
      ],
      skipDuplicates: true,
    });
  }

  // ============================================================================
  // TEST SUITE 1: Public Endpoints (No Authentication)
  // ============================================================================

  describe('GET /government/contacts - Public Endpoint', () => {
    it('should return list of government contacts', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/government/contacts')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.contacts)).toBe(true);
      expect(response.body.contacts.length).toBeGreaterThan(0);
      expect(response.body.contacts[0]).toHaveProperty('name');
      expect(response.body.contacts[0]).toHaveProperty('email');
    });

    it('should return contacts with all required fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/government/contacts')
        .expect(200);

      const contact = response.body.contacts[0];
      expect(contact).toHaveProperty('id');
      expect(contact).toHaveProperty('name');
      expect(contact).toHaveProperty('email');
      expect(contact).toHaveProperty('category');
      expect(contact).toHaveProperty('priority');
    });
  });

  describe('GET /government/status/:petitionId - Public Endpoint', () => {
    it('should return NOT_SUBMITTED for new petition', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/government/status/${testPetitionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('petitionId', testPetitionId);
      expect(response.body).toHaveProperty('submitted', false);
      expect(response.body.status).toBe('NOT_SUBMITTED');
    });

    it('should return NOT_SUBMITTED for non-existent petition', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/government/status/non-existent-id')
        .expect(200);

      expect(response.body).toHaveProperty('submitted', false);
      expect(response.body.status).toBe('NOT_SUBMITTED');
    });
  });

  describe('GET /government/report/:petitionId - Creator-only PDF Download', () => {
    it('should return PDF for petition creator with auth token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/government/report/${testPetitionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain(
        `petition-${testPetitionId}`,
      );
      expect(response.body).toBeTruthy();
    });

    it('should include petition data in PDF', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/government/report/${testPetitionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const pdfContent = response.body?.toString('utf8');
      expect(pdfContent).toContain('Fix Freetown Road Infrastructure');
    });

    it('should return 403 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get(`/api/government/report/${testPetitionId}`)
        .expect(403);
    });

    it('should return 403 for non-creator authenticated user', async () => {
      await request(app.getHttpServer())
        .get(`/api/government/report/${testPetitionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent petition', async () => {
      await request(app.getHttpServer())
        .get('/api/government/report/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('GET /government/report/:petitionId/csv - Creator-only CSV Export', () => {
    it('should return CSV for petition creator', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/government/report/${testPetitionId}/csv`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain(
        `signatures-${testPetitionId}`,
      );
      const csv = response.text;
      expect(csv).toContain('#,Name,Anonymous,Date Signed,County,Verification,Trust Score');
      expect(csv.split('\n').length).toBeGreaterThan(10);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/government/report/${testPetitionId}/csv`)
        .expect(401);
    });

    it('should return 403 for non-creator', async () => {
      await request(app.getHttpServer())
        .get(`/api/government/report/${testPetitionId}/csv`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent petition', async () => {
      await request(app.getHttpServer())
        .get('/api/government/report/non-existent-id/csv')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  // ============================================================================
  // TEST SUITE 2: Authenticated User Endpoints
  // ============================================================================

  describe('POST /government/submit - Authenticated User', () => {
    it('should successfully submit petition with 1000+ signatures', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/government/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          petitionId: testPetitionId,
          governmentEmail: 'minister.works@liberia.gov.lr',
          notes: 'Urgent attention needed',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('submission');
      expect(response.body.submission.status).toBe('SUBMITTED');
      expect(response.body.submission.petitionId).toBe(testPetitionId);
    });

    it('should fail without authentication token', async () => {
      await request(app.getHttpServer())
        .post('/api/government/submit')
        .send({
          petitionId: testPetitionId,
          governmentEmail: 'minister.works@liberia.gov.lr',
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/government/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // Missing petitionId and governmentEmail
        })
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/government/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          petitionId: testPetitionId,
          governmentEmail: 'invalid-email',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid email');
    });

    it('should fail if petition has less than 1000 signatures', async () => {
      // Create petition with few signatures
      const lowSigPetition = await prismaService.petition.create({
        data: {
          title: 'Low Signature Petition',
          summary: 'This petition has few signatures',
          description: 'This petition has few signatures',
          goal: 1000,
          categories: ['government'],
          tags: ['low-signature'],
          creatorId: testUserId,
        },
      });

      // Add only 500 signatures
      for (let i = 0; i < 500; i++) {
        await prismaService.signature.create({
          data: {
            petitionId: lowSigPetition.id,
            name: `Low Signer ${i}`,
            anonymous: false,
          },
        });
      }

      const response = await request(app.getHttpServer())
        .post('/api/government/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          petitionId: lowSigPetition.id,
          governmentEmail: 'minister.works@liberia.gov.lr',
        })
        .expect(400);

      expect(response.body.message).toContain('1000 signatures');
    });

    it('should generate and attach PDF report', async () => {
      const submission = await governmentService.submitToGovernment(
        testPetitionId,
        'test@example.com',
        'Test notes',
      );

      expect(submission).toHaveProperty('documentUrl');
      expect(submission.documentUrl).toContain('petition');
    });

    it('should allow optional notes field', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/government/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          petitionId: testPetitionId,
          governmentEmail: 'minister.health@liberia.gov.lr',
          notes: 'This petition has strong community support',
        })
        .expect(201);

      expect(response.body.submission.notes).toBe(
        'This petition has strong community support',
      );
    });
  });

  describe('GET /government/submissions - Authenticated User', () => {
    it('should return all submissions for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/government/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.submissions)).toBe(true);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/government/submissions')
        .expect(401);
    });

    it('should only show submissions for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/government/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // All submissions should belong to testUserId
      response.body.submissions.forEach((submission: any) => {
        expect(submission.submittedBy).toBe(testUserId);
      });
    });
  });

  // ============================================================================
  // TEST SUITE 3: Admin-Only Endpoints
  // ============================================================================

  describe('POST /government/contacts - Admin Only', () => {
    it('should create new government contact as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/government/contacts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'National Parliament',
          email: 'parliament@liberia.gov.lr',
          phone: '+231-777-999999',
          category: 'PARLIAMENT',
          region: 'MONTSERRADO',
          priority: 3,
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('contact');
      expect(response.body.contact.name).toBe('National Parliament');
      expect(response.body.contact.email).toBe('parliament@liberia.gov.lr');
    });

    it('should fail without admin role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/government/contacts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Unauthorized Contact',
          email: 'unauth@example.com',
          category: 'MINISTRY',
          priority: 10,
        })
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/government/contacts')
        .send({
          name: 'New Contact',
          email: 'contact@example.com',
          category: 'MINISTRY',
          priority: 5,
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/government/contacts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Contact',
          // Missing email and category
        })
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/government/contacts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Bad Email Contact',
          email: 'not-an-email',
          category: 'MINISTRY',
          priority: 5,
        })
        .expect(400);

      expect(response.body.message).toContain('email');
    });
  });

  describe('POST /government/status/:petitionId - Admin Only', () => {
    it('should update submission status as admin', async () => {
      // First submit petition
      await request(app.getHttpServer())
        .post('/api/government/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          petitionId: testPetitionId,
          governmentEmail: 'minister.works@liberia.gov.lr',
        });

      // Then update status as admin
      const response = await request(app.getHttpServer())
        .post(`/api/government/status/${testPetitionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'ACKNOWLEDGED',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.submission.status).toBe('ACKNOWLEDGED');
    });

    it('should validate status values', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/government/status/${testPetitionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INVALID_STATUS',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid status');
    });

    it('should accept all valid statuses', async () => {
      const validStatuses = [
        'SUBMITTED',
        'ACKNOWLEDGED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
      ];

      for (const status of validStatuses) {
        const response = await request(app.getHttpServer())
          .post(`/api/government/status/${testPetitionId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status })
          .expect(200);

        expect(response.body.submission.status).toBe(status);
      }
    });

    it('should fail without admin role', async () => {
      await request(app.getHttpServer())
        .post(`/api/government/status/${testPetitionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'ACKNOWLEDGED' })
        .expect(403);
    });

    it('should require status field', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/government/status/${testPetitionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('status');
    });
  });

  describe('GET /government/stats - Admin Only', () => {
    it('should return submission statistics as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/government/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('totalSubmissions');
      expect(response.body.stats).toHaveProperty('byStatus');
      expect(response.body.stats).toHaveProperty('byMinistry');
    });

    it('should fail without admin role', async () => {
      await request(app.getHttpServer())
        .get('/api/government/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/government/stats')
        .expect(401);
    });

    it('should include status breakdown', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/government/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const byStatus = response.body.stats.byStatus;
      expect(byStatus).toHaveProperty('SUBMITTED');
      expect(byStatus).toHaveProperty('ACKNOWLEDGED');
      expect(byStatus).toHaveProperty('UNDER_REVIEW');
      expect(byStatus).toHaveProperty('APPROVED');
      expect(byStatus).toHaveProperty('REJECTED');
    });
  });

  // ============================================================================
  // TEST SUITE 4: Error Handling & Edge Cases
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      jest
        .spyOn(governmentService, 'generatePetitionReport')
        .mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app.getHttpServer())
        .get(`/api/government/report/${testPetitionId}`)
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });

    it('should sanitize error messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/government/report/invalid')
        .expect(404);

      expect(response.body.message).not.toContain('sql');
      expect(response.body.message).not.toContain('undefined');
    });

    it('should handle concurrent submissions', async () => {
      const promises = [
        request(app.getHttpServer())
          .post('/api/government/submit')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            petitionId: testPetitionId,
            governmentEmail: 'minister.works@liberia.gov.lr',
          }),
        request(app.getHttpServer())
          .post('/api/government/submit')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            petitionId: testPetitionId,
            governmentEmail: 'minister.health@liberia.gov.lr',
          }),
      ];

      const results = await Promise.all(promises);
      expect(results[0].status).toBe(201);
      expect(results[1].status).toBe(201);
    });
  });

  // ============================================================================
  // TEST SUITE 5: Data Validation
  // ============================================================================

  describe('Data Validation', () => {
    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@.com',
        'user name@example.com',
      ];

      for (const email of invalidEmails) {
        await request(app.getHttpServer())
          .post('/api/government/submit')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            petitionId: testPetitionId,
            governmentEmail: email,
          })
          .expect(400);
      }
    });

    it('should trim whitespace from inputs', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/government/contacts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '  Trimmed Name  ',
          email: '  trimmed@example.com  ',
          category: '  MINISTRY  ',
          priority: 5,
        })
        .expect(201);

      expect(response.body.contact.name).toBe('Trimmed Name');
      expect(response.body.contact.email).toBe('trimmed@example.com');
    });
  });
});
