import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { InvoicesService, PayInvoiceDto } from './invoices.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get('me')
  listMine(@CurrentUser() user: AuthUser) {
    return this.invoices.listForUser(user.userId);
  }

  @Post(':id/pay')
  pay(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PayInvoiceDto,
  ) {
    return this.invoices.pay(id, user.userId, dto);
  }
}
