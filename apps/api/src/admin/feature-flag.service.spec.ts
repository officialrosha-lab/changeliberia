import { FeatureFlagService } from './feature-flag.service';

interface FeatureToggleRow {
  name: string;
  enabled: boolean;
  config: string | null;
}

describe('FeatureFlagService', () => {
  const mockPrisma = {
    featureToggle: {
      findUnique: jest.fn<Promise<FeatureToggleRow | null>, [unknown]>(),
      upsert: jest.fn<Promise<FeatureToggleRow>, [unknown]>(),
    },
  };

  let service: FeatureFlagService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FeatureFlagService(mockPrisma as never);
  });

  it('returns false for a toggle that does not exist', async () => {
    mockPrisma.featureToggle.findUnique.mockResolvedValue(null);
    await expect(service.isEnabled('NOT_A_FLAG')).resolves.toBe(false);
  });

  it('returns the stored enabled value', async () => {
    mockPrisma.featureToggle.findUnique.mockResolvedValue({
      name: 'MONETIZATION_ENABLED',
      enabled: true,
      config: null,
    });
    await expect(service.isEnabled('MONETIZATION_ENABLED')).resolves.toBe(true);
  });

  it('caches reads within the TTL window (single DB call for repeated reads)', async () => {
    mockPrisma.featureToggle.findUnique.mockResolvedValue({
      name: 'X',
      enabled: true,
      config: null,
    });
    await service.isEnabled('X');
    await service.isEnabled('X');
    await service.isEnabled('X');
    expect(mockPrisma.featureToggle.findUnique).toHaveBeenCalledTimes(1);
  });

  it('parses JSON config', async () => {
    mockPrisma.featureToggle.findUnique.mockResolvedValue({
      name: 'X',
      enabled: true,
      config: JSON.stringify({ threshold: 100 }),
    });
    await expect(
      service.getConfig<{ threshold: number }>('X'),
    ).resolves.toEqual({
      threshold: 100,
    });
  });

  it('falls back to the raw string for non-JSON scalar config', async () => {
    mockPrisma.featureToggle.findUnique.mockResolvedValue({
      name: 'X',
      enabled: true,
      config: 'MEDIUM',
    });
    await expect(service.getConfig<string>('X')).resolves.toBe('MEDIUM');
  });

  it('returns the fallback when no config is stored', async () => {
    mockPrisma.featureToggle.findUnique.mockResolvedValue({
      name: 'X',
      enabled: false,
      config: null,
    });
    await expect(service.getConfig('X', 'default')).resolves.toBe('default');
  });

  it('setToggle upserts and invalidates the cache so the next read is fresh', async () => {
    mockPrisma.featureToggle.findUnique.mockResolvedValue({
      name: 'X',
      enabled: false,
      config: null,
    });
    await service.isEnabled('X'); // populate cache with false

    mockPrisma.featureToggle.upsert.mockResolvedValue({
      name: 'X',
      enabled: true,
      config: null,
    });
    await service.setToggle('X', true);

    mockPrisma.featureToggle.findUnique.mockResolvedValue({
      name: 'X',
      enabled: true,
      config: null,
    });
    await expect(service.isEnabled('X')).resolves.toBe(true);
  });

  it('falls open to false on a read error rather than throwing', async () => {
    mockPrisma.featureToggle.findUnique.mockRejectedValue(new Error('DB down'));
    await expect(service.isEnabled('X')).resolves.toBe(false);
  });
});
