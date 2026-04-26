import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: { userId: string } }) {
    return this.prisma.user.findUnique({ where: { id: req.user.userId } });
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
        status: true,
        signaturesCount: true,
        goal: true,
        createdAt: true,
      },
    });
  }
}
