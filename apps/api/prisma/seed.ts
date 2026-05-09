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

  // Create CMS Pages with blocks
  console.log('📄 Creating CMS pages...');

  // About Us Page
  const aboutPage = await prisma.cMSPage.upsert({
    where: { slug: 'about' },
    update: {},
    create: {
      title: 'About Change Liberia',
      slug: 'about',
      published: true,
      publishedAt: new Date(),
      authorId: user.id,
      content: '', // Legacy field
      metaDescription: 'Learn about Change Liberia — our mission, values, and how we empower Liberians to drive civic change.',
      metaKeywords: 'about us, civic petitions, Liberia, democracy',
      ogImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
      ogTitle: 'About Change Liberia',
      ogDescription: 'Empowering Liberians to drive civic change through verifiable petitions.',
    },
  });

  await prisma.cMSBlock.deleteMany({ where: { pageId: aboutPage.id } });
  await prisma.cMSBlock.createMany({
    data: [
      {
        pageId: aboutPage.id,
        type: 'hero',
        order: 0,
        props: JSON.stringify({
          title: 'About Change Liberia',
          subtitle: 'Empowering Citizens to Drive Civic Change',
          description: 'Change Liberia is a civic petition platform built by and for Liberians — at home and in the diaspora. We believe that every citizen has the right to raise issues, collect verified support, and have their voices heard by decision-makers.',
          backgroundImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
          ctaText: 'Start a Petition',
          ctaUrl: '/create',
        }),
      },
      {
        pageId: aboutPage.id,
        type: 'text',
        order: 1,
        props: JSON.stringify({
          title: 'Our Mission',
          body: 'To strengthen Liberian democracy by giving every citizen a voice in governance. We do this by providing a transparent, secure platform where Liberians can organize around shared concerns and demand accountability from their leaders.',
          alignment: 'left',
          emphasize: true,
        }),
      },
      {
        pageId: aboutPage.id,
        type: 'grid',
        order: 2,
        props: JSON.stringify({
          title: 'Our Core Values',
          items: [
            {
              icon: '🔍',
              title: 'Transparency',
              description: 'Every petition lifecycle is tracked publicly — from creation to government response. Citizens deserve to see what happens with their voices.',
            },
            {
              icon: '🛡️',
              title: 'Trust & Integrity',
              description: 'We verify identities through phone, email, and national ID to ensure that every signature carries real weight.',
            },
            {
              icon: '⚖️',
              title: 'Accountability',
              description: 'We route petitions to the right authority and publicly track whether a response was given. Silence is also an answer.',
            },
            {
              icon: '🌍',
              title: 'Inclusion',
              description: 'Change Liberia is for every Liberian — at home and in the diaspora. Anyone with a Liberian connection can raise an issue.',
            },
          ],
          columns: 2,
        }),
      },
      {
        pageId: aboutPage.id,
        type: 'text',
        order: 3,
        props: JSON.stringify({
          title: 'Who Runs Change Liberia?',
          body: 'Change Liberia is run by a dedicated team of technologists, civic organizers, and community leaders committed to strengthening democratic participation. We partner with civil society organizations, government ministries, and community groups across all 15 counties.',
          alignment: 'center',
        }),
      },
      {
        pageId: aboutPage.id,
        type: 'cta',
        order: 4,
        props: JSON.stringify({
          title: 'Ready to Make a Difference?',
          description: 'Your voice matters. Start a petition today and build support for the change you want to see.',
          buttons: [
            { text: 'Create a Petition', url: '/create', primary: true },
            { text: 'Browse Petitions', url: '/petitions', primary: false },
          ],
        }),
      },
    ],
  });

  // How It Works Page
  const howitPage = await prisma.cMSPage.upsert({
    where: { slug: 'how-it-works' },
    update: {},
    create: {
      title: 'How It Works',
      slug: 'how-it-works',
      published: true,
      publishedAt: new Date(),
      authorId: user.id,
      content: '', // Legacy field
      metaDescription: 'A step-by-step guide to creating a petition, building support, and reaching decision-makers on Change Liberia.',
      metaKeywords: 'how to create petition, how it works, civic engagement',
      ogImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
      ogTitle: 'How Change Liberia Works',
      ogDescription: 'Simple steps to start a petition and drive civic change.',
    },
  });

  await prisma.cMSBlock.deleteMany({ where: { pageId: howitPage.id } });
  await prisma.cMSBlock.createMany({
    data: [
      {
        pageId: howitPage.id,
        type: 'hero',
        order: 0,
        props: JSON.stringify({
          title: 'How It Works',
          subtitle: 'Four Simple Steps to Civic Change',
          description: 'Creating a petition on Change Liberia is straightforward. From submission to delivery — we guide you every step of the way.',
          backgroundImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
          ctaText: 'Start Now',
          ctaUrl: '/create',
        }),
      },
      {
        pageId: howitPage.id,
        type: 'grid',
        order: 1,
        props: JSON.stringify({
          title: 'The 4-Step Process',
          items: [
            {
              icon: '✍️',
              title: 'Submit Your Issue',
              description: 'Create a petition in minutes. Describe the problem clearly, choose the relevant category — infrastructure, health, governance, or more — and explain what steps you have already taken.',
              details: [
                'No fees, no paperwork',
                'Upload supporting images or documents',
                'Categorise across multiple sectors',
                'Mark prior actions already taken',
              ],
            },
            {
              icon: '🔎',
              title: 'Petition is Reviewed',
              description: 'Our moderation team reviews every petition to ensure it is a genuine civic issue that complies with community guidelines. This usually takes 24–48 hours.',
              details: [
                'Independent moderation process',
                'Declined petitions receive a reason',
                'You can appeal a decision',
                'Review criteria are publicly documented',
              ],
            },
            {
              icon: '🤝',
              title: 'People Sign & Support',
              description: 'Once approved, your petition is published. Share it on WhatsApp, Facebook, and in your community. Verified Liberian signatures carry weight with decision-makers.',
              details: [
                'Phone and email verification increases credibility',
                'Verified diaspora signatures count too',
                'Real-time signature counter',
                'Share via WhatsApp & social media',
              ],
            },
            {
              icon: '🏛️',
              title: 'Government Delivery',
              description: 'When you reach your signature goal, your petition is formally submitted to the relevant government body with a full accountability report.',
              details: [
                'Automatic routing to right authority',
                'Full petition & signatures delivered',
                'Public tracking of government response',
                'Follow-up engagement on outcomes',
              ],
            },
          ],
          columns: 1,
        }),
      },
      {
        pageId: howitPage.id,
        type: 'text',
        order: 2,
        props: JSON.stringify({
          title: 'Why Verified Signatures Matter',
          body: 'On Change Liberia, every signature is verified through phone OTP, email confirmation, and optional national ID verification. This means your petition carries real credibility with government decision-makers — not just volume, but proven support from real Liberians.',
          alignment: 'center',
          emphasize: true,
        }),
      },
      {
        pageId: howitPage.id,
        type: 'faq',
        order: 3,
        props: JSON.stringify({
          title: 'Frequently Asked Questions',
          items: [
            {
              q: 'How long does petition review take?',
              a: 'Most petitions are reviewed within 24–48 hours. Complex or detailed petitions may take up to 72 hours.',
            },
            {
              q: 'What categories can I choose?',
              a: 'You can choose from: Infrastructure, Health, Education, Governance, Environment, Business, Safety, Agriculture, Social Services, and Other.',
            },
            {
              q: 'Is there a signature goal?',
              a: 'You can set a signature target (e.g., 500, 1000). The default is 1000. Once reached, your petition is submitted to the relevant government body.',
            },
            {
              q: 'Can diaspora Liberians sign?',
              a: "Yes! Anyone with a Liberian passport, national ID, or verified Liberian connection can sign — no matter where they live.",
            },
            {
              q: 'What if my petition is rejected?',
              a: "You'll receive a detailed reason. You can appeal the decision or revise and resubmit your petition.",
            },
          ],
        }),
      },
    ],
  });

  // Help Center Page
  const helpPage = await prisma.cMSPage.upsert({
    where: { slug: 'help-center' },
    update: {},
    create: {
      title: 'Help Center',
      slug: 'help-center',
      published: true,
      publishedAt: new Date(),
      authorId: user.id,
      content: '', // Legacy field
      metaDescription: 'Find answers to common questions about creating petitions, signing, verification, and using Change Liberia.',
      metaKeywords: 'help, faq, support, troubleshooting',
      ogImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
      ogTitle: 'Help Center — Change Liberia',
      ogDescription: 'Get help with petitions, accounts, and more.',
    },
  });

  await prisma.cMSBlock.deleteMany({ where: { pageId: helpPage.id } });
  await prisma.cMSBlock.createMany({
    data: [
      {
        pageId: helpPage.id,
        type: 'hero',
        order: 0,
        props: JSON.stringify({
          title: 'Help Center',
          subtitle: 'Everything You Need to Know',
          description: 'Find answers to frequently asked questions about Change Liberia, petitions, signing, verification, and more.',
          backgroundImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
        }),
      },
      {
        pageId: helpPage.id,
        type: 'grid',
        order: 1,
        props: JSON.stringify({
          title: 'Help Categories',
          items: [
            { icon: '🚀', title: 'Getting Started', description: 'Create your first petition, understand the process, and set up your account.' },
            { icon: '✍️', title: 'Creating Petitions', description: 'Best practices for writing your petition, adding media, and choosing the right category.' },
            { icon: '🖊️', title: 'Signing Petitions', description: 'How to sign, what verification means, and why your signature counts.' },
            { icon: '🔐', title: 'Account & Verification', description: 'Phone and ID verification, trust scores, and managing your profile.' },
            { icon: '📢', title: 'Sharing & Growth', description: 'How to promote your petition, reach your signature goal, and engage supporters.' },
            { icon: '⚙️', title: 'Technical Help', description: 'Troubleshooting login issues, page errors, and platform problems.' },
          ],
          columns: 2,
        }),
      },
      {
        pageId: helpPage.id,
        type: 'faq',
        order: 2,
        props: JSON.stringify({
          title: 'General Questions',
          items: [
            {
              q: 'What is Change Liberia?',
              a: 'Change Liberia is a civic petition platform built for Liberians at home and in the diaspora. It lets any citizen raise a verifiable public issue, collect signatures, and have it formally delivered to the right government body — with a public accountability trail.',
            },
            {
              q: 'Do I need to create an account?',
              a: 'You need a free account to create or sign a petition so your support can be verified. Browsing petitions is open to everyone without an account.',
            },
            {
              q: 'Is the platform free to use?',
              a: 'Yes. Creating a petition, signing one, and joining the movement are completely free. There are no fees at any stage.',
            },
            {
              q: 'How do I report a problem?',
              a: 'Email us at support@changelib.org or use the "Report Issue" button on any page. We respond within 24 hours.',
            },
            {
              q: 'How is my data protected?',
              a: 'We use industry-standard encryption and follow strict data privacy policies. Your personal information is never sold or shared without your consent.',
            },
          ],
        }),
      },
      {
        pageId: helpPage.id,
        type: 'faq',
        order: 3,
        props: JSON.stringify({
          title: 'Creating & Managing Petitions',
          items: [
            {
              q: 'How do I start a petition?',
              a: "Click \"Start a Petition\" from any page. You'll go through a form: describe the issue, pick categories and a county, tell the full story, add media (optional), and set your identity preferences. Once submitted, it's reviewed within 24-48 hours.",
            },
            {
              q: 'What happens after I submit?',
              a: 'Your petition enters a review queue. Our moderation team checks it against community guidelines. If approved, it goes live and you can begin collecting signatures. You will be notified of the decision.',
            },
            {
              q: 'Why was my petition rejected?',
              a: 'Common reasons: the issue is not civic/political, offensive language, spam, or duplicate petition. You can appeal or revise and resubmit.',
            },
            {
              q: 'Can I edit my petition after publishing?',
              a: "Yes, you can edit the description and add updates. You cannot change the title or category after launch.",
            },
            {
              q: 'What is a signature goal?',
              a: 'A signature goal is your target number. Default is 1000. Once reached, your petition is automatically submitted to the relevant government body.',
            },
          ],
        }),
      },
      {
        pageId: helpPage.id,
        type: 'faq',
        order: 4,
        props: JSON.stringify({
          title: 'Verification & Signing',
          items: [
            {
              q: 'Why do I need to verify my phone?',
              a: 'Phone verification confirms you are a real person and helps prevent fraud. Verified signatures carry more weight with government decision-makers.',
            },
            {
              q: 'Can I sign anonymously?',
              a: "You can display as \"Anonymous Citizen\" or use a pseudonym, but we verify your identity behind the scenes for security.",
            },
            {
              q: 'What is a trust score?',
              a: 'Your trust score reflects your activity history, verification level, and account age. Higher scores indicate more trusted community members.',
            },
            {
              q: 'How can I verify my national ID?',
              a: "Go to Settings > Verification. You can upload your national ID or driver's license. Verification is voluntary but increases your trust score.",
            },
            {
              q: 'Can diaspora Liberians sign?',
              a: "Yes! Anyone with Liberian heritage or connection can verify and sign. You'll need a Liberian phone number, email, or national ID.",
            },
          ],
        }),
      },
    ],
  });

  console.log('✅ CMS pages created');
}

main().finally(async () => prisma.$disconnect());
