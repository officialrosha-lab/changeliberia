import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GeographyModule } from '../geography/geography.module';
import { UsersController } from './users.controller';

@Module({
  imports: [AuthModule, GeographyModule],
  controllers: [UsersController],
})
export class UsersModule {}
