/**
 * Production Admin Setup Script
 * Ensures the admin user account exists with the correct role
 * 
 * Usage: tsx prisma/setup-production-admin.ts
 * Environment variables:
 * - DATABASE_URL: PostgreSQL connection string (default from .env)
 * - ADMIN_EMAIL: Admin email (default: mharygens@gmail.com)
 * - ADMIN_PHONE: Admin phone (default: +231000000001)
 * - ADMIN_PASSWORD: Admin password (default: Admin231$)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setting up production admin user...\n');

  const email = process.env.ADMIN_EMAIL ?? 'mharygens@gmail.com';
  const phone = process.env.ADMIN_PHONE ?? '+231000000001';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin231$';

  console.log(`📧 Email: ${email}`);
  console.log(`📱 Phone: ${phone}`);
  console.log(`🔐 Password: ${password}\n`);

  const passwordHash = await bcrypt.hash(password, 10);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`✅ User already exists: ${existingUser.id}`);
    console.log(`   Current role: ${existingUser.role}`);
    console.log(`   Current status: ${existingUser.verificationStatus}`);

    if (existingUser.role === 'ADMIN') {
      console.log('\n✅ User is already an admin! No changes needed.');
      return;
    }

    // Upgrade existing user to admin
    console.log('\n⬆️  Upgrading user to ADMIN role...\n');
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: 'ADMIN',
        passwordHash,
        authProvider: 'EMAIL',
        trustScore: 100,
        verificationStatus: 'VERIFIED_LIBERIAN',
        isEmailConfirmed: true,
      },
    });

    console.log('✅ User successfully upgraded to admin!');
    console.log(`   ID: ${updated.id}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Role: ${updated.role}`);
    console.log(`   Status: ${updated.verificationStatus}`);
    return;
  }

  // Create new admin user
  console.log('➕ Creating new admin user...\n');

  const admin = await prisma.user.create({
    data: {
      email,
      fullName: 'Platform Admin',
      phone,
      role: 'ADMIN',
      passwordHash,
      authProvider: 'EMAIL',
      trustScore: 100,
      verificationStatus: 'VERIFIED_LIBERIAN',
      isEmailConfirmed: true,
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Phone: ${admin.phone}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Status: ${admin.verificationStatus}`);
}

main()
  .catch((err) => {
    console.error('❌ Error setting up admin:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
