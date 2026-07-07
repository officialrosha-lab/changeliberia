import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { EndorsementsService } from './endorsements.service';
import { CreateEndorsementDto } from './dto';

interface AuthUser {
  userId: string;
}

@Controller('petitions/:petitionId/endorsements')
export class EndorsementsController {
  constructor(private readonly service: EndorsementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  submit(
    @Param('petitionId') petitionId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateEndorsementDto,
  ) {
    return this.service.submit(petitionId, user.userId, dto);
  }

  // Public: approved endorsements are visible to all citizens
  @Get()
  listApproved(@Param('petitionId') petitionId: string) {
    return this.service.listApproved(petitionId);
  }
}
