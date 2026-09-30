import {
  MembershipSubscriptionStatus,
  PlacementStatus,
  PurchaseStatus,
} from '@prisma/client';
import {
  activateApiSubscription,
  activateEventRegistration,
  activateInvoicePayment,
  activatePetitionPromotion,
  activateResearchProductPurchase,
  activateSponsorshipPurchase,
  cancelApiSubscriptionByProviderSubscriptionId,
  failEventRegistrationByProviderPaymentIntentId,
  failInvoicePaymentByProviderPaymentIntentId,
  failPetitionPromotionByProviderPaymentIntentId,
  failResearchProductPurchaseByProviderPaymentIntentId,
  failSponsorshipPurchaseByProviderPaymentIntentId,
  grantApiSubscriptionEntitlements,
  markApiSubscriptionPastDue,
  revokeApiSubscriptionEntitlements,
} from './monetization-webhook.util';

describe('monetization-webhook.util', () => {
  const mockPrisma = {
    petitionPromotion: {
      findUniqueOrThrow: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    sponsorshipPurchase: {
      findUniqueOrThrow: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    researchProductPurchase: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    eventRegistration: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    invoice: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    apiSubscription: {
      update: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      updateMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
    entitlement: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    entitlementGrant: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
  };
  const mockEntitlementsService = { grant: jest.fn(), revoke: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('activatePetitionPromotion', () => {
    it('defaults to a 7-day window when the promotion has no explicit endsAt', async () => {
      mockPrisma.petitionPromotion.findUniqueOrThrow.mockResolvedValue({
        id: 'promo-1',
        startsAt: null,
        endsAt: null,
      });
      mockPrisma.petitionPromotion.update.mockResolvedValue({ id: 'promo-1' });

      await activatePetitionPromotion(mockPrisma as never, 'promo-1', {
        providerPaymentIntentId: 'pi_1',
        eventId: 'evt_1',
      });

      const call = mockPrisma.petitionPromotion.update.mock.calls[0][0] as {
        data: { status: PlacementStatus; startsAt: Date; endsAt: Date };
      };
      expect(call.data.status).toBe(PlacementStatus.ACTIVE);
      const days =
        (call.data.endsAt.getTime() - call.data.startsAt.getTime()) /
        (24 * 60 * 60 * 1000);
      expect(days).toBeCloseTo(7, 5);
    });
  });

  describe('failPetitionPromotionByProviderPaymentIntentId', () => {
    it('returns null when no promotion matches', async () => {
      mockPrisma.petitionPromotion.findUnique.mockResolvedValue(null);
      const result = await failPetitionPromotionByProviderPaymentIntentId(
        mockPrisma as never,
        'pi_ghost',
        'evt_1',
      );
      expect(result).toBeNull();
    });

    it('marks the promotion CANCELLED (never became ACTIVE)', async () => {
      mockPrisma.petitionPromotion.findUnique.mockResolvedValue({
        id: 'promo-1',
      });
      mockPrisma.petitionPromotion.update.mockResolvedValue({
        id: 'promo-1',
        status: PlacementStatus.CANCELLED,
      });
      const result = await failPetitionPromotionByProviderPaymentIntentId(
        mockPrisma as never,
        'pi_1',
        'evt_1',
      );
      expect(result?.status).toBe(PlacementStatus.CANCELLED);
    });
  });

  describe('activateSponsorshipPurchase', () => {
    it('computes endsAt from the package durationDays', async () => {
      mockPrisma.sponsorshipPurchase.findUniqueOrThrow.mockResolvedValue({
        id: 'sp-1',
        package: { durationDays: 30 },
      });
      mockPrisma.sponsorshipPurchase.update.mockResolvedValue({ id: 'sp-1' });

      await activateSponsorshipPurchase(mockPrisma as never, 'sp-1', {
        providerPaymentIntentId: 'pi_1',
        eventId: 'evt_1',
      });

      const call = mockPrisma.sponsorshipPurchase.update.mock.calls[0][0] as {
        data: { startsAt: Date; endsAt: Date };
      };
      const days =
        (call.data.endsAt.getTime() - call.data.startsAt.getTime()) /
        (24 * 60 * 60 * 1000);
      expect(days).toBeCloseTo(30, 5);
    });
  });

  describe('failSponsorshipPurchaseByProviderPaymentIntentId', () => {
    it('returns null when no purchase matches', async () => {
      mockPrisma.sponsorshipPurchase.findUnique.mockResolvedValue(null);
      const result = await failSponsorshipPurchaseByProviderPaymentIntentId(
        mockPrisma as never,
        'pi_ghost',
        'evt_1',
      );
      expect(result).toBeNull();
    });

    it('marks the purchase CANCELLED (never became ACTIVE)', async () => {
      mockPrisma.sponsorshipPurchase.findUnique.mockResolvedValue({
        id: 'sp-1',
      });
      mockPrisma.sponsorshipPurchase.update.mockResolvedValue({
        id: 'sp-1',
        status: PlacementStatus.CANCELLED,
      });
      const result = await failSponsorshipPurchaseByProviderPaymentIntentId(
        mockPrisma as never,
        'pi_1',
        'evt_1',
      );
      expect(result?.status).toBe(PlacementStatus.CANCELLED);
    });
  });

  describe('activateResearchProductPurchase', () => {
    it('marks COMPLETED', async () => {
      mockPrisma.researchProductPurchase.update.mockResolvedValue({
        id: 'rpp-1',
        status: PurchaseStatus.COMPLETED,
      });
      const result = await activateResearchProductPurchase(
        mockPrisma as never,
        'rpp-1',
        {
          providerPaymentIntentId: 'pi_1',
          eventId: 'evt_1',
        },
      );
      expect(result.status).toBe(PurchaseStatus.COMPLETED);
    });
  });

  describe('failResearchProductPurchaseByProviderPaymentIntentId', () => {
    it('returns null when no purchase matches', async () => {
      mockPrisma.researchProductPurchase.findUnique.mockResolvedValue(null);
      const result = await failResearchProductPurchaseByProviderPaymentIntentId(
        mockPrisma as never,
        'pi_ghost',
        'evt_1',
      );
      expect(result).toBeNull();
    });
  });

  describe('activateEventRegistration', () => {
    it('marks purchaseStatus COMPLETED', async () => {
      mockPrisma.eventRegistration.update.mockResolvedValue({
        id: 'reg-1',
        purchaseStatus: PurchaseStatus.COMPLETED,
      });
      const result = await activateEventRegistration(
        mockPrisma as never,
        'reg-1',
        {
          providerPaymentIntentId: 'pi_1',
          eventId: 'evt_1',
        },
      );
      expect(result.purchaseStatus).toBe(PurchaseStatus.COMPLETED);
    });
  });

  describe('failEventRegistrationByProviderPaymentIntentId', () => {
    it('REGRESSION: cancels the registration itself (not just the purchase) on payment failure — a failed-payment registration must never hold a seat', async () => {
      mockPrisma.eventRegistration.findUnique.mockResolvedValue({
        id: 'reg-1',
      });
      mockPrisma.eventRegistration.update.mockResolvedValue({ id: 'reg-1' });

      await failEventRegistrationByProviderPaymentIntentId(
        mockPrisma as never,
        'pi_1',
        'evt_1',
      );

      expect(mockPrisma.eventRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            purchaseStatus: PurchaseStatus.FAILED,
            status: 'CANCELLED',
          }) as unknown,
        }),
      );
    });
  });

  describe('activateInvoicePayment', () => {
    it('marks the invoice PAID and stamps paidAt', async () => {
      mockPrisma.invoice.update.mockResolvedValue({
        id: 'inv-1',
        status: 'PAID',
      });
      const result = await activateInvoicePayment(
        mockPrisma as never,
        'inv-1',
        {
          providerPaymentIntentId: 'pi_1',
          eventId: 'evt_1',
        },
      );
      expect(result.status).toBe('PAID');
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: expect.objectContaining({
            status: 'PAID',
            providerPaymentIntentId: 'pi_1',
            lastWebhookEventId: 'evt_1',
          }) as unknown,
        }),
      );
    });
  });

  describe('failInvoicePaymentByProviderPaymentIntentId', () => {
    it('returns null when no invoice matches', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      const result = await failInvoicePaymentByProviderPaymentIntentId(
        mockPrisma as never,
        'pi_ghost',
        'evt_1',
      );
      expect(result).toBeNull();
    });

    it('REGRESSION: leaves the invoice ISSUED (not a terminal FAILED state) so the buyer can retry payment', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        status: 'ISSUED',
      });
      mockPrisma.invoice.update.mockResolvedValue({ id: 'inv-1' });

      await failInvoicePaymentByProviderPaymentIntentId(
        mockPrisma as never,
        'pi_1',
        'evt_1',
      );

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { lastWebhookEventId: 'evt_1' },
        }),
      );
    });
  });

  describe('API subscription (mirrors membership/organization webhook util)', () => {
    it('grantApiSubscriptionEntitlements grants under the API_PLAN source', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent-1',
        key: 'ENTITLEMENT_A',
      });
      mockPrisma.entitlementGrant.findFirst.mockResolvedValue(null);

      await grantApiSubscriptionEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        {
          id: 'api-sub-1',
          userId: 'user-1',
          plan: { entitlementKeys: JSON.stringify(['ENTITLEMENT_A']) },
        } as never,
      );

      expect(mockEntitlementsService.grant).toHaveBeenCalledWith({
        entitlementKey: 'ENTITLEMENT_A',
        userId: 'user-1',
        source: 'API_PLAN',
        sourceId: 'api-sub-1',
      });
    });

    it('revokeApiSubscriptionEntitlements revokes grants sourced from API_PLAN', async () => {
      mockPrisma.entitlementGrant.findMany.mockResolvedValue([
        { id: 'grant-1' },
      ]);
      await revokeApiSubscriptionEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        'api-sub-1',
      );
      expect(mockEntitlementsService.revoke).toHaveBeenCalledWith('grant-1');
    });

    it('activateApiSubscription marks ACTIVE and grants entitlements', async () => {
      mockPrisma.apiSubscription.update.mockResolvedValue({
        id: 'api-sub-1',
        userId: 'user-1',
        plan: { entitlementKeys: '[]' },
      });
      const result = await activateApiSubscription(
        mockPrisma as never,
        mockEntitlementsService as never,
        'api-sub-1',
        {
          providerSubscriptionId: 'sub_1',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          eventId: 'evt_1',
        },
      );
      expect(result.id).toBe('api-sub-1');
      expect(mockPrisma.apiSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: MembershipSubscriptionStatus.ACTIVE,
          }) as unknown,
        }),
      );
    });

    it('cancelApiSubscriptionByProviderSubscriptionId returns null when no match', async () => {
      mockPrisma.apiSubscription.findUnique.mockResolvedValue(null);
      const result = await cancelApiSubscriptionByProviderSubscriptionId(
        mockPrisma as never,
        mockEntitlementsService as never,
        'sub_ghost',
        'evt_1',
      );
      expect(result).toBeNull();
    });

    it('markApiSubscriptionPastDue is a no-op-safe updateMany', async () => {
      mockPrisma.apiSubscription.updateMany.mockResolvedValue({ count: 0 });
      await markApiSubscriptionPastDue(mockPrisma as never, 'sub_1', 'evt_1');
      expect(mockPrisma.apiSubscription.updateMany).toHaveBeenCalledWith({
        where: { providerSubscriptionId: 'sub_1' },
        data: {
          status: MembershipSubscriptionStatus.PAST_DUE,
          lastWebhookEventId: 'evt_1',
        },
      });
    });
  });
});
