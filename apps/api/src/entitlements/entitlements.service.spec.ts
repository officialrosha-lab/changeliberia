import { EntitlementScope } from '@prisma/client';
import { EntitlementsService } from './entitlements.service';

describe('EntitlementsService', () => {
  const mockPrisma = {
    entitlement: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
    entitlementGrant: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
  };

  let service: EntitlementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EntitlementsService(mockPrisma as never);
  });

  describe('hasEntitlement', () => {
    it('returns false when no actor identifiers are provided', async () => {
      await expect(service.hasEntitlement({}, 'ENTITLEMENT_X')).resolves.toBe(
        false,
      );
      expect(mockPrisma.entitlement.findUnique).not.toHaveBeenCalled();
    });

    it('returns false when the entitlement key does not exist', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue(null);
      await expect(
        service.hasEntitlement({ userId: 'u1' }, 'NOT_REAL'),
      ).resolves.toBe(false);
    });

    it('returns true when an active, non-revoked grant matches the actor', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent1',
        key: 'ENTITLEMENT_X',
      });
      mockPrisma.entitlementGrant.findFirst.mockResolvedValue({ id: 'g1' });

      await expect(
        service.hasEntitlement({ userId: 'u1' }, 'ENTITLEMENT_X'),
      ).resolves.toBe(true);

      expect(mockPrisma.entitlementGrant.findFirst).toHaveBeenCalledWith({
        where: {
          entitlementId: 'ent1',
          revokedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: expect.any(Date) as Date } },
          ],
          AND: [{ OR: [{ userId: 'u1' }] }],
        },
      });
    });

    it('returns false when no matching grant is found', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent1',
        key: 'ENTITLEMENT_X',
      });
      mockPrisma.entitlementGrant.findFirst.mockResolvedValue(null);

      await expect(
        service.hasEntitlement({ institutionId: 'inst1' }, 'ENTITLEMENT_X'),
      ).resolves.toBe(false);
    });
  });

  describe('createEntitlement', () => {
    it('rejects a duplicate key', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.createEntitlement({
          key: 'DUP',
          name: 'Dup',
          scope: EntitlementScope.USER,
        }),
      ).rejects.toThrow('already exists');
    });

    it('creates a new entitlement', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue(null);
      mockPrisma.entitlement.create.mockResolvedValue({
        id: 'new1',
        key: 'NEW',
        name: 'New',
        scope: EntitlementScope.USER,
      });
      const result = await service.createEntitlement({
        key: 'NEW',
        name: 'New',
        scope: EntitlementScope.USER,
      });
      expect(result).toMatchObject({ key: 'NEW' });
    });
  });

  describe('grant', () => {
    it('throws if the entitlement key does not exist', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue(null);
      await expect(
        service.grant({
          entitlementKey: 'GHOST',
          userId: 'u1',
          source: 'MANUAL_ADMIN',
        }),
      ).rejects.toThrow('not found');
    });

    it('requires userId for a USER-scoped entitlement', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent1',
        key: 'USER_SCOPED',
        scope: EntitlementScope.USER,
      });
      await expect(
        service.grant({
          entitlementKey: 'USER_SCOPED',
          source: 'MANUAL_ADMIN',
        }),
      ).rejects.toThrow('userId is required');
    });

    it('requires institutionId for an INSTITUTION-scoped entitlement', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent1',
        key: 'INST_SCOPED',
        scope: EntitlementScope.INSTITUTION,
      });
      await expect(
        service.grant({
          entitlementKey: 'INST_SCOPED',
          source: 'MANUAL_ADMIN',
        }),
      ).rejects.toThrow('institutionId is required');
    });

    it('creates a grant row with the resolved target', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent1',
        key: 'USER_SCOPED',
        scope: EntitlementScope.USER,
      });
      mockPrisma.entitlementGrant.create.mockResolvedValue({ id: 'grant1' });

      await service.grant({
        entitlementKey: 'USER_SCOPED',
        userId: 'u1',
        source: 'MANUAL_ADMIN',
      });

      expect(mockPrisma.entitlementGrant.create).toHaveBeenCalledWith({
        data: {
          entitlementId: 'ent1',
          source: 'MANUAL_ADMIN',
          sourceId: undefined,
          expiresAt: undefined,
          userId: 'u1',
        },
      });
    });
  });

  describe('revoke', () => {
    it('throws NotFoundException for an unknown grant', async () => {
      mockPrisma.entitlementGrant.findUnique.mockResolvedValue(null);
      await expect(service.revoke('ghost')).rejects.toThrow('not found');
    });

    it('sets revokedAt on the grant', async () => {
      mockPrisma.entitlementGrant.findUnique.mockResolvedValue({ id: 'g1' });
      mockPrisma.entitlementGrant.update.mockResolvedValue({
        id: 'g1',
        revokedAt: new Date(),
      });
      await service.revoke('g1');
      expect(mockPrisma.entitlementGrant.update).toHaveBeenCalledWith({
        where: { id: 'g1' },
        data: { revokedAt: expect.any(Date) as Date },
      });
    });
  });
});
