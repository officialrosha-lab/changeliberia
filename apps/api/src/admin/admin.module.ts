import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VerificationModule } from '../verification/verification.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, VerificationModule],
  controllers: [AdminController],
})
export class AdminModule {}
