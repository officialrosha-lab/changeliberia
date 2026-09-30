import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';
import { AdminModule } from '../admin/admin.module';
import { PaymentModule } from '../payments/payment.module';
import { PetitionPromotionsService } from './petition-promotions.service';
import { SponsorshipsService } from './sponsorships.service';
import { ResearchProductsService } from './research-products.service';
import { EventsService } from './events.service';
import { ApiBillingService } from './api-billing.service';
import { InvoicesService } from './invoices.service';
import { ServiceRequestsService } from './service-requests.service';
import { PetitionPromotionsController } from './petition-promotions.controller';
import { AdminPetitionPromotionsController } from './admin-petition-promotions.controller';
import { SponsorshipsController } from './sponsorships.controller';
import { AdminSponsorshipsController } from './admin-sponsorships.controller';
import { ResearchProductsController } from './research-products.controller';
import { AdminResearchProductsController } from './admin-research-products.controller';
import { EventsController } from './events.controller';
import { AdminEventsController } from './admin-events.controller';
import { ApiBillingController } from './api-billing.controller';
import { AdminApiBillingController } from './admin-api-billing.controller';
import { ServiceRequestsController } from './service-requests.controller';
import { AdminServiceRequestsController } from './admin-service-requests.controller';
import { InvoicesController } from './invoices.controller';
import { AdminInvoicesController } from './admin-invoices.controller';

@Module({
  imports: [PrismaModule, ActivityModule, AdminModule, PaymentModule],
  controllers: [
    PetitionPromotionsController,
    AdminPetitionPromotionsController,
    SponsorshipsController,
    AdminSponsorshipsController,
    ResearchProductsController,
    AdminResearchProductsController,
    EventsController,
    AdminEventsController,
    ApiBillingController,
    AdminApiBillingController,
    ServiceRequestsController,
    AdminServiceRequestsController,
    InvoicesController,
    AdminInvoicesController,
  ],
  providers: [
    PetitionPromotionsService,
    SponsorshipsService,
    ResearchProductsService,
    EventsService,
    ApiBillingService,
    InvoicesService,
    ServiceRequestsService,
  ],
  exports: [
    PetitionPromotionsService,
    SponsorshipsService,
    ResearchProductsService,
    EventsService,
    ApiBillingService,
    InvoicesService,
    ServiceRequestsService,
  ],
})
export class MonetizationModule {}
