import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PasswordProvider } from '../auth/password.provider';
import { PrismaService } from '../prisma/prisma.service';

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsInt() @Min(1) @Max(120) age?: number;
  @IsOptional() @IsString() @MaxLength(200) address?: string;
  @IsOptional() @IsString() @MaxLength(60) county?: string;
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordProvider: PasswordProvider,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: { userId: string } }) {
    return this.prisma.user.findUnique({ where: { id: req.user.userId } });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Req() req: { user: { userId: string } },
    @Body() body: UpdateProfileDto,
  ) {
    return this.prisma.user.update({
      where: { id: req.user.userId },
      data: body,
    });
  }

  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  async changePassword(
    @Req() req: { user: { userId: string } },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user?.passwordHash) throw new BadRequestException('No password set on this account');

    const valid = await this.passwordProvider.verifyPassword(body.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const strength = this.passwordProvider.validatePasswordStrength(body.newPassword);
    if (!strength.isValid) throw new BadRequestException(strength.message);

    const passwordHash = await this.passwordProvider.hashPassword(body.newPassword);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/petitions')
  myPetitions(@Req() req: { user: { userId: string } }) {
    return this.prisma.petition.findMany({
      where: { creatorId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        summary: true,
        description: true,
        imageUrl: true,
        status: true,
        signaturesCount: true,
        goal: true,
        createdAt: true,
      },
    });
  }
}
