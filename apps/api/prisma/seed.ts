import { PrismaClient, PetitionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { phone: '+231770000001' },
    update: { role: 'ADMIN' },
    create: {
      fullName: 'Satta K. Doe',
      phone: '+231770000001',
      email: 'satta@example.com',
      role: 'ADMIN',
      trustScore: 70,
      verificationStatus: 'VERIFIED_LIBERIAN',
    },
  });

  const petition = await prisma.petition.create({
    data: {
      title: 'Fix Sinkor Community Roads Before Rainy Season',
      summary: 'Thousands cannot safely commute when rains begin.',
      description: 'Residents of Sinkor are requesting emergency rehabilitation of primary roads and drainage infrastructure before peak rainfall.',
      goal: 5000,
      status: PetitionStatus.APPROVED,
      creatorId: user.id,
      signaturesCount: 1240,
      todaySignatures: 95,
      imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390',
    },
  });

  await prisma.signature.create({
    data: {
      petitionId: petition.id,
      userId: user.id,
      name: 'Satta K. Doe',
      trustScoreSnapshot: 70,
      ipAddress: '41.191.100.1',
    },
  });

  await prisma.verificationLog.createMany({
    data: [
      { userId: user.id, type: 'OTP', delta: 40, details: 'Phone OTP complete' },
      { userId: user.id, type: 'IP_GEO', delta: 20, details: 'Liberia geolocated IP' },
      { userId: user.id, type: 'DEVICE', delta: 10, details: 'Known device' },
    ],
  });

  await prisma.fraudRule.createMany({
    data: [
      {
        key: 'rapid_signatures_per_ip',
        description: 'Maximum signatures from same IP per minute',
        threshold: 5,
        penalty: 50,
      },
      {
        key: 'duplicate_device_reuse',
        description: 'Repeated device use across many signatures',
        threshold: 3,
        penalty: 30,
      },
      {
        key: 'high_velocity_petition',
        description: 'Unusual burst signatures on one petition',
        threshold: 25,
        penalty: 20,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.fraudEvent.create({
    data: {
      userId: user.id,
      petitionId: petition.id,
      ruleKey: 'rapid_signatures_per_ip',
      details: 'IP 41.191.100.1 exceeded rapid signature threshold.',
      riskPoints: 50,
      ipAddress: '41.191.100.1',
    },
  });

  await prisma.fraudAnomalySnapshot.create({
    data: {
      windowStart: new Date(Date.now() - 60 * 60 * 1000),
      windowEnd: new Date(),
      totalSignatures: 120,
      suspiciousSignatures: 12,
      uniqueIps: 84,
      uniqueDevices: 77,
      riskIndex: 0.18,
    },
  });

  await prisma.petitionUpdate.create({
    data: {
      petitionId: petition.id,
      title: 'Met with district engineer',
      body: 'We presented community signatures and requested a timeline for grading and drainage work on12th Street.',
    },
  });

  await prisma.petitionComment.createMany({
    data: [
      {
        petitionId: petition.id,
        authorName: 'James W.',
        body: 'This road floods every year — thank you for organizing.',
      },
      {
        petitionId: petition.id,
        authorName: 'Miatta S.',
        body: 'Signed and shared with my church group.',
      },
    ],
  });

  // Create WhatsApp milestones and referrals
  console.log('🔗 Creating WhatsApp viral engine data...');

  // Add milestones for the petition
  await prisma.petitionMilestone.createMany({
    data: [
      {
        petitionId: petition.id,
        type: 'SIGNATURES',
        targetValue: 10,
        currentValue: 1240,
        achieved: true,
        achievedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      },
      {
        petitionId: petition.id,
        type: 'SIGNATURES',
        targetValue: 50,
        currentValue: 1240,
        achieved: true,
        achievedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      },
      {
        petitionId: petition.id,
        type: 'SIGNATURES',
        targetValue: 100,
        currentValue: 1240,
        achieved: true,
        achievedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        petitionId: petition.id,
        type: 'SIGNATURES',
        targetValue: 500,
        currentValue: 1240,
        achieved: true,
        achievedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        petitionId: petition.id,
        type: 'SIGNATURES',
        targetValue: 1000,
        currentValue: 1240,
        achieved: true,
        achievedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Just hit!
      },
    ],
    skipDuplicates: true,
  });

  // Create referral codes and share links
  const referralCodes = [
    { code: 'SATT001', clickCount: 45, conversions: 12, trustBonusApplied: 60 },
    { code: 'SATT002', clickCount: 28, conversions: 8, trustBonusApplied: 40 },
    { code: 'SATT003', clickCount: 15, conversions: 3, trustBonusApplied: 15 },
    { code: 'SATT004', clickCount: 62, conversions: 18, trustBonusApplied: 90 },
  ];

  for (const ref of referralCodes) {
    const referral = await prisma.referral.upsert({
      where: { referralCode: ref.code },
      update: {
        petitionId: petition.id,
        referrerId: user.id,
        status: ref.conversions > 0 ? 'CONVERTED' : 'PENDING',
      },
      create: {
        petitionId: petition.id,
        referrerId: user.id,
        referralCode: ref.code,
        shareUrl: `https://changelib.org/r/${ref.code.toLowerCase()}`,
        whatsappMessage: `🇱🇷 Check this important petition! We need to fix our roads before the rainy season. Every signature counts! ${ref.code}`,
        status: ref.conversions > 0 ? 'CONVERTED' : 'PENDING',
        trustBonusApplied: ref.trustBonusApplied,
        clickCount: ref.clickCount,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Create associated share link with unique short code
    const shortCode = `${ref.code.substring(0, 4).toLowerCase()}${Math.random().toString(36).substring(2, 4)}`;
    await prisma.shareLink.upsert({
      where: { shortCode },
      update: {
        petitionId: petition.id,
        referralId: referral.id,
      },
      create: {
        shortCode,
        targetUrl: `https://changelib.org/petitions/${petition.id}?ref=${ref.code}`,
        petitionId: petition.id,
        referralId: referral.id,
        clickCount: ref.clickCount,
        conversions: ref.conversions,
        source: 'whatsapp',
        medium: 'referral',
        campaign: 'user_share',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✅ WhatsApp viral engine data created');

  // Create government contacts for submissions
  console.log('🏛️  Creating government contacts...');

  await prisma.governmentContact.createMany({
    data: [
      {
        name: 'Ministry of Public Works',
        email: 'submissions@mpw.gov.lr',
        phone: '+231-770-000-100',
        category: 'MINISTRY',
        region: 'NATIONAL',
        priority: 10,
        isActive: true,
        notes: 'Primary contact for infrastructure petitions',
      },
      {
        name: 'House of Representatives',
        email: 'petitions@legislature.gov.lr',
        phone: '+231-770-000-101',
        category: 'PARLIAMENT',
        region: 'NATIONAL',
        priority: 9,
        isActive: true,
        notes: 'For legislative action petitions',
      },
      {
        name: 'Montserrado County Authority',
        email: 'public@montserado.gov.lr',
        phone: '+231-770-000-102',
        category: 'LOCAL_AUTHORITY',
        region: 'MONTSERRADO',
        priority: 8,
        isActive: true,
        notes: 'County-level coordination',
      },
      {
        name: 'Civil Society Advocacy Group',
        email: 'info@csag.org.lr',
        category: 'NGO',
        region: 'NATIONAL',
        priority: 7,
        isActive: true,
        notes: 'Third-party advocacy partner',
      },
      {
        name: 'Office of the President',
        email: 'executive.office@presidency.gov.lr',
        phone: '+231-770-000-103',
        category: 'EXECUTIVE',
        region: 'NATIONAL',
        priority: 6,
        isActive: true,
        notes: 'High-level escalation contact',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Government contacts created');

  // Create a sample petition submission
  console.log('📤 Creating sample petition submission...');

  await prisma.petitionSubmission.create({
    data: {
      petitionId: petition.id,
      governmentEmail: 'submissions@mpw.gov.lr',
      status: 'SUBMITTED',
      submittedBy: user.id,
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      signatureCount: 1240,
      notes: 'Submitted via Change Liberia platform with full citizen support documentation',
    },
  });

  console.log('✅ Sample submission created');
}

main().finally(async () => prisma.$disconnect());
