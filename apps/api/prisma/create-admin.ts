import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'mharygens@gmail.com';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin231$';
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
  .catch((err) => console.error('⚠️  create-admin failed (non-fatal):', err?.message ?? err))
  .finally(() => prisma.$disconnect());
