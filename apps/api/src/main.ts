import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Application } from 'express';
import { mkdirSync } from 'fs';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validateEnvOrThrow } from './config/env-validation';
import { metricsRegister } from './metrics/prometheus.metrics';
import { PrismaService } from './prisma/prisma.service';
import { rawBodyMiddleware } from './common/middleware/raw-body.middleware';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

class RedisIoAdapter extends IoAdapter {
  private pubClient?: ReturnType<typeof createClient>;
  private subClient?: ReturnType<typeof createClient>;

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options);

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.pubClient = createClient({ url: redisUrl });
    this.subClient = this.pubClient.duplicate();

    Promise.all([this.pubClient.connect(), this.subClient.connect()])
      .then(() => {
        if (this.pubClient && this.subClient) {
          server.adapter(createAdapter(this.pubClient, this.subClient));
          console.log('[RedisIoAdapter] Socket.IO Redis adapter connected');
        }
      })
      .catch(async (error) => {
        console.warn('[RedisIoAdapter] Failed to connect to Redis, falling back to default adapter', error);
        // Disconnect whichever client connected successfully to avoid resource leaks
        if (this.pubClient?.isOpen) await this.pubClient.disconnect().catch(() => {});
        if (this.subClient?.isOpen) await this.subClient.disconnect().catch(() => {});
      });

    return server;
  }

  async closeRedisConnections(): Promise<void> {
    if (this.pubClient?.isOpen) await this.pubClient.disconnect().catch(() => {});
    if (this.subClient?.isOpen) await this.subClient.disconnect().catch(() => {});
  }
}

function parseCorsOrigins(): boolean | string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORS_ORIGIN environment variable is required in production');
    }
    return ['http://localhost:3000'];
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isSwaggerEnabled(): boolean {
  const prod = process.env.NODE_ENV === 'production';
  if (process.env.ENABLE_SWAGGER === 'true') return true;
  if (process.env.ENABLE_SWAGGER === 'false') return false;
  return !prod;
}

// Prevent unhandled Promise rejections (e.g. from Prisma's async engine
// initialisation) from crashing the process before app.listen() is reached.
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[bootstrap] Unhandled rejection (non-fatal):', reason);
});

async function ensureSchema(prisma: PrismaService) {
  const stmts = [
    // Petition columns from platform_v2_governance migration
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "categories" TEXT[]`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "county" TEXT`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "displayName" TEXT`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "priorActions" TEXT`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "tags" TEXT[]`,
    // Petition columns from add_petition_category and add_petition_type migrations
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "category" TEXT`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "petitionType" TEXT`,
    // Petition donation columns from cms_events_notifications_donations migration
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "donationsEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "donationGoal" DOUBLE PRECISION`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "totalDonations" DOUBLE PRECISION NOT NULL DEFAULT 0`,
    // UserRole enum + column (user_role_phase8) — JwtStrategy SELECTs role on every request
    // CREATE TYPE has no IF NOT EXISTS before PG16; catch{} handles duplicate_object silently
    `CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN')`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER'`,
    // AuthProvider enum + column (add_email_verification migration)
    `CREATE TYPE "AuthProvider" AS ENUM ('PHONE', 'EMAIL', 'GOOGLE')`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authProvider" "AuthProvider" NOT NULL DEFAULT 'PHONE'`,
    // User columns from platform_v2_governance migration
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "age" INTEGER`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "county" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT`,
    // User columns from cms_events_notifications_donations migration
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "badgesEarned" TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT`,
    // User columns from add_webhook_fields migration
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT`,
    // Membership table
    `CREATE TABLE IF NOT EXISTS "Membership" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'supporter',
      "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Membership_userId_key" ON "Membership"("userId")`,
    `CREATE INDEX IF NOT EXISTS "Membership_role_joinedAt_idx" ON "Membership"("role", "joinedAt")`,
    // PetitionStatusLog table — written on every petition.create()
    `CREATE TABLE IF NOT EXISTS "PetitionStatusLog" (
      "id" TEXT NOT NULL,
      "petitionId" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PetitionStatusLog_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE INDEX IF NOT EXISTS "PetitionStatusLog_petitionId_createdAt_idx" ON "PetitionStatusLog"("petitionId", "createdAt")`,
    // Supporter table
    `CREATE TABLE IF NOT EXISTS "Supporter" (
      "id" TEXT NOT NULL,
      "sessionId" TEXT NOT NULL,
      "userId" TEXT,
      "email" TEXT,
      "phone" TEXT,
      "source" TEXT NOT NULL DEFAULT 'navbar',
      "ipAddress" TEXT,
      "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Supporter_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Supporter_sessionId_key" ON "Supporter"("sessionId")`,
    `CREATE INDEX IF NOT EXISTS "Supporter_ipAddress_idx" ON "Supporter"("ipAddress")`,
    // AmbassadorApplication table
    `CREATE TABLE IF NOT EXISTS "AmbassadorApplication" (
      "id" TEXT NOT NULL,
      "fullName" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "location" TEXT NOT NULL,
      "occupation" TEXT,
      "motivation" TEXT NOT NULL,
      "growthPlan" TEXT NOT NULL,
      "socialLinks" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AmbassadorApplication_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "AmbassadorApplication_email_key" ON "AmbassadorApplication"("email")`,
    `CREATE INDEX IF NOT EXISTS "AmbassadorApplication_status_idx" ON "AmbassadorApplication"("status")`,
    `CREATE INDEX IF NOT EXISTS "AmbassadorApplication_createdAt_idx" ON "AmbassadorApplication"("createdAt")`,
    // Sponsor table
    `CREATE TABLE IF NOT EXISTS "Sponsor" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "logoUrl" TEXT NOT NULL,
      "websiteUrl" TEXT,
      "type" TEXT NOT NULL DEFAULT 'sponsor',
      "displayOrder" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
    )`,
  ];
  for (const sql of stmts) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      // each statement is idempotent — ignore duplicate-object errors
    }
  }
  // FK constraints — added separately since they fail if already present
  const fks = [
    `ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "PetitionStatusLog" ADD CONSTRAINT "PetitionStatusLog_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  ];
  for (const sql of fks) {
    try { await prisma.$executeRawUnsafe(sql); } catch { /* already exists */ }
  }
}

async function seedCmsPages(prisma: PrismaService) {
  try {
    if ((await prisma.cMSPage.count()) > 0) return;
  } catch {
    return;
  }

  const aboutSections = [
    {
      id: 'hero',
      label: 'Hero Section',
      html: '<p class="text-xs font-bold uppercase tracking-widest text-emerald-200">About us</p><h1 class="mt-3 text-4xl font-extrabold text-white sm:text-5xl">Built for Liberians, by Liberians.</h1><p class="mx-auto mt-4 max-w-2xl text-base text-emerald-100 sm:text-lg">Change Liberia is a civic petition platform that gives every Liberian — from Montserrado to Lofa — the tools to raise real issues, build verified public support, and deliver their voices to the people who can act on them.</p>',
    },
    {
      id: 'mission',
      label: 'Mission Statement',
      html: '<p class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Our mission</p><h2 class="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50 sm:text-4xl">Turning citizen voices into government action</h2><p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-neutral-400">Liberia is a democracy — but democratic participation should not require money, political connections, or media access. Change Liberia removes those barriers. We provide the infrastructure for any citizen to raise a credible issue, gather verified public support, and have it formally delivered to the relevant institution with a public paper trail.</p>',
    },
    {
      id: 'values',
      label: 'Our Values',
      html: '<p class="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Our values</p><h2 class="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">What we stand for</h2><div class="mt-10 grid gap-6 sm:grid-cols-2"><div class="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">🔍</div><h3 class="mt-4 text-lg font-bold text-zinc-900 dark:text-neutral-50">Transparency</h3><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Every petition lifecycle is tracked publicly — from creation to government response. Citizens deserve to see what happens with their voices.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">🛡️</div><h3 class="mt-4 text-lg font-bold text-zinc-900 dark:text-neutral-50">Trust &amp; Integrity</h3><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">We verify identities through phone, email, and national ID to ensure that every signature carries real weight.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">⚖️</div><h3 class="mt-4 text-lg font-bold text-zinc-900 dark:text-neutral-50">Accountability</h3><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">We route petitions to the right authority and publicly track whether a response was given. Silence is also an answer.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">🌍</div><h3 class="mt-4 text-lg font-bold text-zinc-900 dark:text-neutral-50">Inclusion</h3><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Change Liberia is for every Liberian — at home and in the diaspora. Anyone with a Liberian connection can raise an issue.</p></div></div>',
    },
    {
      id: 'governance',
      label: 'Governance & Team',
      html: '<p class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Governance &amp; ownership</p><h2 class="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">Who runs Change Liberia?</h2><div class="mt-6 space-y-4 text-base leading-relaxed text-zinc-600 dark:text-neutral-400"><p>Change Liberia is operated as a civic technology initiative committed to the public interest. The platform is independently funded and does not accept political donations or endorsements from any party, candidate, or government body.</p><p>Our editorial and moderation policies are documented and publicly available. Petitions are reviewed for compliance with community guidelines before approval — not for political alignment. No legitimate civic grievance is suppressed.</p><p>We operate under Liberian law and comply with all applicable data protection regulations. User identity data is stored securely and is never shared with third parties or government agencies without a lawful court order.</p></div><div class="mt-8 grid gap-4 sm:grid-cols-3"><div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-neutral-700 dark:bg-neutral-900"><div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl dark:bg-emerald-950">🏛️</div><p class="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-500">Platform Director</p><p class="mt-1 text-sm font-bold text-zinc-900 dark:text-neutral-50">Change Liberia Initiative</p></div><div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-neutral-700 dark:bg-neutral-900"><div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl dark:bg-emerald-950">🏛️</div><p class="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-500">Technical Lead</p><p class="mt-1 text-sm font-bold text-zinc-900 dark:text-neutral-50">Engineering Team</p></div><div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-neutral-700 dark:bg-neutral-900"><div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl dark:bg-emerald-950">🏛️</div><p class="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-500">Community Liaison</p><p class="mt-1 text-sm font-bold text-zinc-900 dark:text-neutral-50">Civil Society Partners</p></div></div>',
    },
    {
      id: 'contact',
      label: 'Contact',
      html: '<p class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Get in touch</p><h2 class="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">Contact us</h2><p class="mt-4 text-base text-zinc-600 dark:text-neutral-400">For platform inquiries, partnership proposals, media requests, or to report abuse, reach us at:</p><div class="mt-6 space-y-2 text-sm font-medium text-zinc-700 dark:text-neutral-300"><p>Email: <a href="mailto:hello@changelib.org" class="text-emerald-600 underline dark:text-emerald-400">hello@changelib.org</a></p><p>WhatsApp: +231 77 000 0000</p><p>Monrovia, Liberia</p></div>',
    },
  ];

  const howItWorksSections = [
    {
      id: 'hero',
      label: 'Hero Section',
      html: '<p class="text-xs font-bold uppercase tracking-widest text-emerald-400">How it works</p><h1 class="mt-3 text-4xl font-extrabold text-white sm:text-5xl">From issue to action — step by step.</h1><p class="mx-auto mt-4 max-w-2xl text-base text-zinc-300 sm:text-lg">Change Liberia is not just a petition tool. It is a structured civic process that connects citizens directly to decision-makers with verified public evidence.</p>',
    },
    {
      id: 'stages',
      label: '7 Stages Intro',
      html: '<p class="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">The process</p><h2 class="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">7 stages of change</h2><p class="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-600 dark:text-neutral-400">Every petition follows this transparent lifecycle — publicly visible at every stage.</p>',
    },
    {
      id: 'trust',
      label: 'Trust Section',
      html: '<p class="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Why it works</p><h2 class="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">Built on verified trust</h2><div class="mt-10 grid gap-6 sm:grid-cols-3"><div class="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-800"><div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl dark:bg-emerald-950">📱</div><h3 class="font-bold text-zinc-900 dark:text-neutral-50">Phone verification</h3><p class="mt-2 text-sm text-zinc-500 dark:text-neutral-400">Every signer verifies their phone number, confirming they are a real person.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-800"><div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl dark:bg-emerald-950">🪪</div><h3 class="font-bold text-zinc-900 dark:text-neutral-50">ID verification</h3><p class="mt-2 text-sm text-zinc-500 dark:text-neutral-400">High-trust signatures come from users who upload a national ID or passport.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-800"><div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl dark:bg-emerald-950">🔒</div><h3 class="font-bold text-zinc-900 dark:text-neutral-50">Fraud detection</h3><p class="mt-2 text-sm text-zinc-500 dark:text-neutral-400">Our system detects and removes bot signatures, duplicate accounts, and anomalous patterns.</p></div></div>',
    },
    {
      id: 'faqs',
      label: 'FAQ Section',
      html: '<p class="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">FAQ</p><h2 class="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">Common questions</h2><div class="mt-10 space-y-4"><div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-700 dark:bg-neutral-900"><p class="font-semibold text-zinc-900 dark:text-neutral-50">Do I need to be a Liberian citizen to use Change Liberia?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">You need a Liberian connection — citizen, resident, or diaspora. You will need a valid phone number to verify your identity.</p></div><div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-700 dark:bg-neutral-900"><p class="font-semibold text-zinc-900 dark:text-neutral-50">Is it free to create a petition?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Yes, completely free. Creating, signing, and sharing petitions costs nothing.</p></div><div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-700 dark:bg-neutral-900"><p class="font-semibold text-zinc-900 dark:text-neutral-50">What happens if my petition is rejected?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">You will receive a reason. If your petition is a genuine civic issue that complies with our guidelines, you can revise and resubmit or submit an appeal.</p></div><div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-700 dark:bg-neutral-900"><p class="font-semibold text-zinc-900 dark:text-neutral-50">Can I stay anonymous?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Yes. You can enable the anonymous option when creating your petition. Your legal identity is kept securely on our servers but is never shown publicly.</p></div><div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-700 dark:bg-neutral-900"><p class="font-semibold text-zinc-900 dark:text-neutral-50">What if the authority does not respond?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Silence is documented. The petition page will show "No response received" as a public record. This itself can generate media and political pressure.</p></div><div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-700 dark:bg-neutral-900"><p class="font-semibold text-zinc-900 dark:text-neutral-50">Can I petition for anything?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">No. Petitions must be civic issues — infrastructure, health, education, governance, environment, rights, etc. Personal disputes, commercial claims, and defamatory content are not allowed.</p></div></div>',
    },
  ];

  const helpCenterSections = [
    {
      id: 'hero',
      label: 'Hero Section',
      html: '<p class="text-xs font-bold uppercase tracking-widest text-emerald-200">Support</p><h1 class="mt-3 text-4xl font-extrabold text-white sm:text-5xl">Help Center</h1><p class="mx-auto mt-4 max-w-xl text-base text-emerald-100 sm:text-lg">Everything you need to create petitions, gather support, and understand how Change Liberia works.</p>',
    },
    {
      id: 'categories',
      label: 'Help Categories',
      html: '<p class="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Browse by topic</p><h2 class="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">How can we help?</h2><div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div class="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">🚀</div><h3 class="mt-4 text-base font-bold text-zinc-900 dark:text-neutral-50">Getting Started</h3><p class="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">Create your first petition, understand the process, and set up your account.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">✍️</div><h3 class="mt-4 text-base font-bold text-zinc-900 dark:text-neutral-50">Creating Petitions</h3><p class="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">Best practices for writing your petition, adding media, and choosing the right category.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">🖊️</div><h3 class="mt-4 text-base font-bold text-zinc-900 dark:text-neutral-50">Signing Petitions</h3><p class="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">How to sign, what verification means, and why your signature counts.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">🔐</div><h3 class="mt-4 text-base font-bold text-zinc-900 dark:text-neutral-50">Account &amp; Verification</h3><p class="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">Phone and ID verification, trust scores, and managing your profile.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">📢</div><h3 class="mt-4 text-base font-bold text-zinc-900 dark:text-neutral-50">Sharing &amp; Growth</h3><p class="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">How to promote your petition, reach your signature goal, and engage supporters.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">⚙️</div><h3 class="mt-4 text-base font-bold text-zinc-900 dark:text-neutral-50">Technical Help</h3><p class="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">Troubleshooting login issues, page errors, and platform problems.</p></div></div>',
    },
    {
      id: 'faqs',
      label: 'FAQ Section',
      html: '<p class="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Common questions</p><h2 class="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">Frequently asked questions</h2><div class="mt-10 space-y-10"><div><h3 class="mb-4 text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Getting Started</h3><div class="space-y-4"><div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"><p class="font-semibold text-zinc-900 dark:text-neutral-50">What is Change Liberia?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Change Liberia is a civic petition platform built for Liberians at home and in the diaspora. It lets any citizen raise a verifiable public issue, collect signatures, and have it formally delivered to the right government body — with a public accountability trail.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"><p class="font-semibold text-zinc-900 dark:text-neutral-50">Do I need to create an account to use the platform?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">You need a free account to create or sign a petition so your support can be verified. Browsing petitions is open to everyone without an account.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"><p class="font-semibold text-zinc-900 dark:text-neutral-50">Is the platform free to use?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Yes. Creating a petition, signing one, and joining the movement are completely free. There are no fees at any stage.</p></div></div></div><div><h3 class="mb-4 text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Creating Petitions</h3><div class="space-y-4"><div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"><p class="font-semibold text-zinc-900 dark:text-neutral-50">How do I start a petition?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Click "Start a petition" from any page. You\'ll go through a 5-step form: describe the issue, pick categories and a county, tell the full story, add media (optional), and set your identity preferences. Once submitted, your petition is reviewed by our team within 24-48 hours.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"><p class="font-semibold text-zinc-900 dark:text-neutral-50">What happens after I submit my petition?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Your petition enters a review queue. Our moderation team checks it against community guidelines — usually within 24–48 hours. If approved, it goes live and you can begin collecting signatures. You will be notified of the decision.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"><p class="font-semibold text-zinc-900 dark:text-neutral-50">Can I make my petition anonymous?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Yes. During creation you can enable the anonymity option. Your legal identity is still securely stored for verification purposes, but only a public display name (or "Anonymous") will be shown on the petition page.</p></div></div></div><div><h3 class="mb-4 text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Account &amp; Verification</h3><div class="space-y-4"><div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"><p class="font-semibold text-zinc-900 dark:text-neutral-50">What is a trust score?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Your trust score is a number from 0–100 that reflects how verified your identity is. Higher trust scores make your signatures carry more credibility. You earn points by verifying your phone, uploading a national ID, and signing in from Liberia.</p></div><div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"><p class="font-semibold text-zinc-900 dark:text-neutral-50">Is my personal data safe?</p><p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">Yes. We store identity data securely and encrypted. We never sell or share your data with third parties. Data is only disclosed under a lawful Liberian court order. See our Privacy Policy for full details.</p></div></div></div></div>',
    },
    {
      id: 'contact',
      label: 'Contact Support',
      html: '<p class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Still stuck?</p><h2 class="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">Contact our support team</h2><p class="mx-auto mt-4 max-w-lg text-base text-zinc-600 dark:text-neutral-400">We typically respond within one business day. For urgent matters — including abuse reports — mark your subject line URGENT.</p><div class="mt-6 space-y-2 text-sm font-medium text-zinc-700 dark:text-neutral-300"><p>Email: <a href="mailto:hello@changelib.org" class="text-emerald-600 underline dark:text-emerald-400">hello@changelib.org</a></p><p>WhatsApp: +231 77 000 0000</p></div>',
    },
  ];

  const pages = [
    { title: 'About Us', slug: 'about', sections: aboutSections },
    { title: 'How It Works', slug: 'how-it-works', sections: howItWorksSections },
    { title: 'Help Center', slug: 'help-center', sections: helpCenterSections },
  ];

  for (const p of pages) {
    try {
      await prisma.cMSPage.create({
        data: {
          title: p.title,
          slug: p.slug,
          content: JSON.stringify(p.sections),
          published: true,
          publishedAt: new Date(),
          authorId: null,
        },
      });
    } catch {
      // already exists — skip
    }
  }
}

async function bootstrap() {
  validateEnvOrThrow();
  const app = await NestFactory.create(AppModule);
  const useRedisAdapter = process.env.USE_REDIS_ADAPTER !== 'false';
  let redisAdapter: RedisIoAdapter | undefined;

  if (useRedisAdapter) {
    redisAdapter = new RedisIoAdapter(app);
    app.useWebSocketAdapter(redisAdapter);
  }

  const enableSwagger = isSwaggerEnabled();
  
  // Register raw body middleware only for webhook routes (signature verification requires raw body)
  // Applying it globally would consume the body stream before NestJS parses req.body
  app.use('/api/v1/payments/webhook', rawBodyMiddleware());
  app.use('/api/v1/webhooks/resend', rawBodyMiddleware());
  
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: enableSwagger ? false : undefined,
    }),
  );
  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
  });
  const prisma = app.get(PrismaService);
  await ensureSchema(prisma);
  await seedCmsPages(prisma);
  const httpServer = app.getHttpAdapter().getInstance() as Application;

  const uploadsRoot = join(process.cwd(), 'uploads');
  mkdirSync(join(uploadsRoot, 'id-documents'), { recursive: true });
  mkdirSync(join(uploadsRoot, 'petition-media'), { recursive: true });

  httpServer.get('/metrics', async (_req, res) => {
    res.set('Content-Type', metricsRegister.contentType);
    res.end(await metricsRegister.metrics());
  });

  httpServer.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  httpServer.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not_ready' });
    }
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Change Liberia API')
      .setDescription(
        'REST API for petitions, verification, and fraud operations.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);

  if (redisAdapter) {
    const adapter = redisAdapter;
    const cleanup = () => { void adapter.closeRedisConnections(); };
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
  }
}

void bootstrap();
