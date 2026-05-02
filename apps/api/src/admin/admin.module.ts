import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationModule } from '../verification/verification.module';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, VerificationModule, PrismaModule],
  controllers: [AdminController, AdminSettingsController],
})
export class AdminModule {}
