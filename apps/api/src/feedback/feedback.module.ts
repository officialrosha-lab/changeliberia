import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { PrismaModule as DatabaseModule } from '../prisma/prisma.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FeedbackController],
  providers: [],
})
export class FeedbackModule {}
