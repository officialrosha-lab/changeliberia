import { Module } from '@nestjs/common';
import { AmbassadorsController } from './ambassadors.controller';
import { AmbassadorsService } from './ambassadors.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AmbassadorsController],
  providers: [AmbassadorsService, PrismaService],
  exports: [AmbassadorsService],
})
export class AmbassadorsModule {}
