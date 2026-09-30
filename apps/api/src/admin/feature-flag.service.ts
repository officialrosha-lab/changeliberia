import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  enabled: boolean;
  config: string | null;
  expiresAt: number;
}

/**
 * Thin wrapper over the existing `FeatureToggle` key-value store (already
 * used by admin-settings/system-settings/moderator controllers) — not a new
 * flag system. Adds a typed isEnabled/getConfig API with a short in-memory
 * TTL cache so hot paths (e.g. gating a monetization product) don't hit the
 * DB on every call. Falls open to `false`/`null` on any read error rather
 * than throwing, since a missing/misbehaving flag should never take down
 * the feature it's meant to gate optionally.
 */
@Injectable()
export class FeatureFlagService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(name: string): Promise<boolean> {
    const entry = await this.getEntry(name);
    return entry?.enabled ?? false;
  }

  async getConfig<T = unknown>(
    name: string,
    fallback?: T,
  ): Promise<T | undefined> {
    const entry = await this.getEntry(name);
    if (!entry?.config) return fallback;
    try {
      return JSON.parse(entry.config) as T;
    } catch {
      // Non-JSON scalar config (e.g. a raw number/string), as already used
      // by admin-settings.controller.ts's mapSystemSettings().
      return entry.config as unknown as T;
    }
  }

  async setToggle(
    name: string,
    enabled: boolean,
    config?: string,
    description?: string,
  ) {
    const toggle = await this.prisma.featureToggle.upsert({
      where: { name },
      create: { name, enabled, config, description },
      update: { enabled, config, description },
    });
    this.cache.delete(name);
    return toggle;
  }

  invalidate(name: string) {
    this.cache.delete(name);
  }

  private async getEntry(name: string): Promise<CacheEntry | null> {
    const cached = this.cache.get(name);
    if (cached && cached.expiresAt > Date.now()) return cached;

    try {
      const toggle = await this.prisma.featureToggle.findUnique({
        where: { name },
      });
      const entry: CacheEntry = {
        enabled: toggle?.enabled ?? false,
        config: toggle?.config ?? null,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      this.cache.set(name, entry);
      return entry;
    } catch {
      return null;
    }
  }
}
