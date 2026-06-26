/**
 * One-time script: sets a password + ADMIN role on the mharygens@gmail.com account.
 * Run on Railway: railway run npx tsx apps/api/scripts/set-admin-password.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const EMAIL = 'mharygens@gmail.com';
const NEW_PASSWORD = process.argv[2];

async function main() {
  if (!NEW_PASSWORD || NEW_PASSWORD.length < 8) {
    console.error('Usage: npx tsx apps/api/scripts/set-admin-password.ts <new-password>');
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });

    if (!user) {
      console.error(`No user found with email: ${EMAIL}`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);

    await prisma.user.update({
      where: { email: EMAIL },
      data: {
        passwordHash,
        role: 'ADMIN',
        isEmailConfirmed: true,
        authProvider: 'EMAIL',
      },
    });

    console.log(`✅ Password set and ADMIN role confirmed for ${EMAIL}`);
    console.log(`   User ID: ${user.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
