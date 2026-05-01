import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupportersController } from './supporters.controller';
import { SupportersService } from './supporters.service';

@Module({
  imports: [PrismaModule],
  controllers: [SupportersController],
  providers: [SupportersService],
})
export class SupportersModule {}
