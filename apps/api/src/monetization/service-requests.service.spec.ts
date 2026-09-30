import { ServiceRequestStatus } from '@prisma/client';
import { ServiceRequestsService } from './service-requests.service';

describe('ServiceRequestsService', () => {
  const mockPrisma = {
    professionalServiceRequest: {
      create: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };
  const mockInvoices = { createDraft: jest.fn() };
  const mockActivityLogger = { logAsync: jest.fn() };

  let service: ServiceRequestsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServiceRequestsService(
      mockPrisma as never,
      mockInvoices as never,
      mockActivityLogger as never,
    );
  });

  describe('get', () => {
    it('throws NotFoundException for an unknown request', async () => {
      mockPrisma.professionalServiceRequest.findUnique.mockResolvedValue(null);
      await expect(service.get('ghost', 'user-1', false)).rejects.toThrow(
        'not found',
      );
    });

    it("REGRESSION: refuses a non-admin, non-requester caller access to someone else's request", async () => {
      mockPrisma.professionalServiceRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        requesterUserId: 'other-user',
      });
      await expect(service.get('req-1', 'user-1', false)).rejects.toThrow(
        'do not have access',
      );
    });

    it('allows an admin to view any request', async () => {
      mockPrisma.professionalServiceRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        requesterUserId: 'other-user',
      });
      await expect(
        service.get('req-1', 'admin-1', true),
      ).resolves.toBeDefined();
    });
  });

  describe('advance', () => {
    it('throws NotFoundException for an unknown request', async () => {
      mockPrisma.professionalServiceRequest.findUnique.mockResolvedValue(null);
      await expect(
        service.advance('ghost', 'admin-1', {
          toStatus: ServiceRequestStatus.SCOPING,
        }),
      ).rejects.toThrow('not found');
    });

    it('REGRESSION: rejects an invalid pipeline transition (e.g. SUBMITTED straight to DELIVERED)', async () => {
      mockPrisma.professionalServiceRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: ServiceRequestStatus.SUBMITTED,
      });
      await expect(
        service.advance('req-1', 'admin-1', {
          toStatus: ServiceRequestStatus.DELIVERED,
        }),
      ).rejects.toThrow('Cannot move a request from SUBMITTED to DELIVERED');
    });

    it('requires quotedAmount when moving to QUOTED', async () => {
      mockPrisma.professionalServiceRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: ServiceRequestStatus.SCOPING,
      });
      await expect(
        service.advance('req-1', 'admin-1', {
          toStatus: ServiceRequestStatus.QUOTED,
        }),
      ).rejects.toThrow('quotedAmount is required');
    });

    it('auto-drafts an Invoice when moving to QUOTED with an amount', async () => {
      mockPrisma.professionalServiceRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: ServiceRequestStatus.SCOPING,
        requesterUserId: 'user-1',
        organizationId: null,
        institutionId: null,
        title: 'Data visualization dashboard',
        currency: 'USD',
      });
      mockPrisma.professionalServiceRequest.update.mockResolvedValue({
        id: 'req-1',
        status: ServiceRequestStatus.QUOTED,
      });

      await service.advance('req-1', 'admin-1', {
        toStatus: ServiceRequestStatus.QUOTED,
        quotedAmount: 5000,
      });

      expect(mockInvoices.createDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceRequestId: 'req-1',
          lineItems: [
            { description: 'Data visualization dashboard', unitAmount: 5000 },
          ],
        }),
      );
    });

    it('does not draft an Invoice for a transition that is not QUOTED', async () => {
      mockPrisma.professionalServiceRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: ServiceRequestStatus.SUBMITTED,
      });
      mockPrisma.professionalServiceRequest.update.mockResolvedValue({
        id: 'req-1',
        status: ServiceRequestStatus.SCOPING,
      });

      await service.advance('req-1', 'admin-1', {
        toStatus: ServiceRequestStatus.SCOPING,
      });

      expect(mockInvoices.createDraft).not.toHaveBeenCalled();
    });
  });
});
