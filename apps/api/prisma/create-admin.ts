import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
    // Runs on every deploy (see package.json's start script) and would
    // otherwise upsert a hardcoded default password onto the admin
    // account whenever these aren't set — refuse instead of doing that.
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must both be set in production; refusing to create/reset the admin account with a default credential.',
    );
  }
  const email = process.env.ADMIN_EMAIL ?? 'mharygens@gmail.com';
  const password = process.env.ADMIN_PASSWORD ?? 'dev-only-admin-password';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      passwordHash,
      authProvider: 'EMAIL',
    },
    create: {
      email,
      fullName: 'Super Admin',
      phone: process.env.ADMIN_PHONE ?? '+231000000001',
      role: 'ADMIN',
      passwordHash,
      authProvider: 'EMAIL',
      trustScore: 100,
      verificationStatus: 'VERIFIED_LIBERIAN',
    },
  });

  console.log(`✅ Admin user ready: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((err: unknown) =>
    console.error(
      '⚠️  create-admin failed (non-fatal):',
      err instanceof Error ? err.message : err,
    ),
  )
  .finally(() => prisma.$disconnect());
