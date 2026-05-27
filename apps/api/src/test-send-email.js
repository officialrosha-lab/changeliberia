const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSendEmail() {
  try {
    // Create test email in database
    const emailLog = await prisma.emailLog.create({
      data: {
        user: { connect: { id: 'cmpneuet400011hteet7wu5ld' } },
        recipient: 'admin2@test.local',
        subject: 'Test Email from Change Liberia',
        type: 'WELCOME',
        status: 'SENT'
      }
    });
    
    console.log('✓ Created email log:', emailLog.id);
    console.log('  To:', emailLog.recipient);
    console.log('  Subject:', emailLog.subject);
    console.log('  Type:', emailLog.type);
    console.log('  Status:', emailLog.status);
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

testSendEmail();
