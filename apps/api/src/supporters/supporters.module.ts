import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import {
  SupportersController,
  AdminSupportersController,
} from './supporters.controller';
import { SupportersService } from './supporters.service';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [SupportersController, AdminSupportersController],
  providers: [SupportersService],
})
export class SupportersModule {}
