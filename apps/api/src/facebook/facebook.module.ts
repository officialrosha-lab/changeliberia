import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { FacebookService } from './facebook.service';
import { FacebookPixelService } from './facebook-pixel.service';
import { BadgeService } from './badge.service';
import { ChallengeService } from './challenge.service';
import { FacebookController } from './facebook.controller';
import { BadgeController } from './badge.controller';
import { ChallengeController } from './challenge.controller';
import { FacebookSDKService } from './facebook-sdk.service';
import { ShareDialogService } from './share-dialog.service';
import { RealPixelTrackingService } from './real-pixel-tracking.service';

@Module({
  imports: [PrismaModule, forwardRef(() => EventsModule)],
  controllers: [
    FacebookController,
    BadgeController,
    ChallengeController,
  ],
  providers: [
    FacebookService,
    FacebookPixelService,
    BadgeService,
    ChallengeService,
    FacebookSDKService,
    ShareDialogService,
    RealPixelTrackingService,
  ],
  exports: [
    FacebookService,
    FacebookPixelService,
    BadgeService,
    ChallengeService,
    FacebookSDKService,
    ShareDialogService,
    RealPixelTrackingService,
  ],
})
export class FacebookModule {}
