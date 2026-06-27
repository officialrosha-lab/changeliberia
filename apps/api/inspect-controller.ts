import { Test } from '@nestjs/testing';
import { BadgeController } from './src/facebook/badge.controller';
import { BadgeService } from './src/facebook/badge.service';
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
  const module = await Test.createTestingModule({
    controllers: [BadgeController],
    providers: [
      BadgeService,
      {
        provide: PrismaService,
        useValue: { petition: { findUnique: () => undefined } },
      },
    ],
  }).compile();
  try {
    const controller = module.get(BadgeController);
    console.log('controller.constructor.name', controller.constructor.name);
    console.log('ownProps', Object.getOwnPropertyNames(controller));
    console.log('protoProps', Object.getOwnPropertyNames(Object.getPrototypeOf(controller)));
    console.log('has badgeService property', 'badgeService' in controller);
    console.log('badgeService descriptor', Object.getOwnPropertyDescriptor(controller, 'badgeService'));
    console.log('controller.badgeService', (controller as any).badgeService);
  } finally {
    await module.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
