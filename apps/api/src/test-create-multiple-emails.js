const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMultipleEmails() {
  try {
    const userId = 'cmpneuet400011hteet7wu5ld';
    
    // Create multiple emails with different statuses
    const emails = await prisma.emailLog.createMany({
      data: [
        {
          userId,
          recipient: 'admin2@test.local',
          subject: 'Petition Approved Notification',
          type: 'PETITION_APPROVED',
          status: 'DELIVERED',
          deliveredAt: new Date()
        },
        {
          userId,
          recipient: 'admin2@test.local',
          subject: 'Weekly Digest Summary',
          type: 'WEEKLY_DIGEST',
          status: 'OPENED',
          sentAt: new Date(),
          openedAt: new Date()
        },
        {
          userId,
          recipient: 'admin2@test.local',
          subject: 'Government Response Received',
          type: 'OFFICIAL_RESPONSE',
          status: 'OPENED',
          sentAt: new Date(),
          openedAt: new Date(),
          clickedAt: new Date()
        }
      ]
    });
    
    console.log('✓ Created', emails.count, 'test emails');
    
    // Get updated stats
    const total = await prisma.emailLog.count({ where: { userId } });
    const sent = await prisma.emailLog.count({ where: { userId, status: 'SENT' } });
    const delivered = await prisma.emailLog.count({ where: { userId, status: 'DELIVERED' } });
    const opened = await prisma.emailLog.count({ where: { userId, status: 'OPENED' } });
    
    console.log('\nEmail Statistics:');
    console.log('  Total:', total);
    console.log('  Sent:', sent);
    console.log('  Delivered:', delivered);
    console.log('  Opened:', opened);
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

testMultipleEmails();
