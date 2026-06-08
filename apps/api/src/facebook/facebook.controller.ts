import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
  HttpCode,
  BadRequestException,
  NotFoundException,
  Optional,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookPixelService } from './facebook-pixel.service';
import { FacebookSDKService } from './facebook-sdk.service';
import { RealPixelTrackingService } from './real-pixel-tracking.service';
import { ShareDialogService } from './share-dialog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('facebook')
export class FacebookController {
  private readonly logger = new Logger(FacebookController.name);

  constructor(
    private facebookService: FacebookService,
    private pixelService: FacebookPixelService,
    @Optional() private facebookSdk?: FacebookSDKService,
    @Optional() private pixelTracking?: RealPixelTrackingService,
    @Optional() private shareDialog?: ShareDialogService,
  ) {}

  @Get('sdk-init')
  getSdkInit() {
    try {
      const initCode =
        typeof this.facebookSdk?.getSdkInitCode === 'function'
          ? this.facebookSdk!.getSdkInitCode()
          : '<!-- SDK not configured -->';

      return {
        success: true,
        data: { initCode },
      };
    } catch (err) {
      this.logger.error(`Failed to get SDK init: ${String(err)}`);
      return { success: false };
    }
  }

  @Get('pixel')
  getPixelCode() {
    try {
      const pixelCode =
        typeof this.facebookSdk?.getPixelInitCode === 'function'
          ? this.facebookSdk!.getPixelInitCode()
          : this.pixelService.getPixelInitCode();
      const pixelId =
        typeof this.facebookSdk?.getPixelId === 'function'
          ? this.facebookSdk!.getPixelId()
          : this.pixelService.getPixelId();

      return { success: true, data: { pixelId, initCode: pixelCode } };
    } catch (err) {
      this.logger.error(`Failed to get pixel code: ${String(err)}`);
      return { success: false, error: `Failed to get pixel code: ${String(err)}` };
    }
  }

  @Get('og-meta/:petitionId')
  async getOpenGraphMeta(@Param('petitionId') petitionId: string) {
    try {
      const ogMeta = await this.facebookService.generateOpenGraphMeta(petitionId);
      return { success: true, data: ogMeta };
    } catch (err) {
      this.logger.error(`Failed to get OG meta: ${String(err)}`);
      throw new NotFoundException(`Petition ${petitionId} not found`);
    }
  }

  @Get('share-dialog/:petitionId')
  async getShareDialog(@Param('petitionId') petitionId: string, @Query('networkSize') networkSize?: string) {
    try {
      const userNetworkSize = networkSize ? parseInt(networkSize, 10) : 250;

      const dialogConfig =
        typeof this.shareDialog?.getShareDialogConfig === 'function'
          ? this.shareDialog!.getShareDialogConfig(petitionId, 'Title', 'https://example.com/img.jpg')
          : this.facebookService.buildFacebookShareDialog(petitionId, userNetworkSize);

      return { success: true, data: dialogConfig };
    } catch (err) {
      this.logger.error(`Failed to get share dialog: ${String(err)}`);
      throw new NotFoundException(`Petition ${petitionId} not found`);
    }
  }

  @Post('record-share')
  @UseGuards(JwtAuthGuard)
  async recordShareEvent(
    @Body()
    shareEvent: {
      petitionId: string;
      shortCode?: string;
      method?: 'dialog' | 'native' | 'other';
    },
    @CurrentUser() user: { sub: string },
  ) {
    const { petitionId, shortCode, method } = shareEvent || ({} as any);
    const userId = user?.sub;

    if (!userId) {
      throw new BadRequestException('Authenticated user required');
    }

    if (!petitionId || (!shortCode && !method)) {
      throw new BadRequestException('petitionId and shortCode or method are required');
    }

    try {
      if (method && typeof this.shareDialog?.recordShareCompletion === 'function') {
        await this.shareDialog!.recordShareCompletion(userId, petitionId, method);
      } else if (shortCode) {
        await this.facebookService.recordFacebookShare(petitionId, userId, shortCode);
      }

      return { success: true, message: 'Share event recorded' };
    } catch (err) {
      this.logger.error(`Failed to record share: ${String(err)}`);
      throw new NotFoundException('Petition or share link not found');
    }
  }

  @Post('track-view')
  async trackView(@Body() body: { petitionId: string; userId?: string; metadata?: any }) {
    const { petitionId, userId, metadata } = body || ({} as any);
    if (!petitionId) throw new BadRequestException('petitionId is required');

    if (!this.pixelTracking) return { success: false, message: 'pixel tracking unavailable' };
    const result = await this.pixelTracking.trackViewContent(petitionId, userId, metadata);
    return { success: result.success, data: result };
  }

  @Post('track-lead')
  async trackLead(@Body() body: { petitionId: string; userId: string; metadata?: any }) {
    const { petitionId, userId, metadata } = body || ({} as any);
    if (!petitionId || !userId) throw new BadRequestException('petitionId and userId are required');

    if (!this.pixelTracking) return { success: false, message: 'pixel tracking unavailable' };
    const result = await this.pixelTracking.trackLead(petitionId, userId, metadata);
    return { success: result.success, data: result };
  }

  @Post('track-share')
  async trackShare(@Body() body: { petitionId: string; userId: string; method?: string }) {
    const { petitionId, userId, method } = body || ({} as any);
    if (!petitionId || !userId) throw new BadRequestException('petitionId and userId are required');

    if (!this.pixelTracking) return { success: false, message: 'pixel tracking unavailable' };
    const methodValue: 'dialog' | 'native' | 'other' = method === 'dialog' || method === 'native' ? (method as any) : 'other';
    const result = await this.pixelTracking.trackShare(petitionId, userId, methodValue);
    return { success: result.success, data: result };
  }

  @Post('track-purchase')
  async trackPurchase(@Body() body: { petitionId: string; userId: string; amount: number; currency?: string; metadata?: any }) {
    const { petitionId, userId, amount, currency, metadata } = body || ({} as any);
    if (!petitionId || !userId || amount === undefined) throw new BadRequestException('petitionId, userId and amount are required');

    if (!this.pixelTracking) return { success: false, message: 'pixel tracking unavailable' };
    const result = await this.pixelTracking.trackPurchase(petitionId, userId, amount, currency || 'USD', metadata);
    return { success: result.success, data: result };
  }

  @Get('pixel-stats/:petitionId')
  async getPixelStats(@Param('petitionId') petitionId: string) {
    try {
      if (!this.pixelTracking) return { success: false };
      const stats = await this.pixelTracking.getPixelStats(petitionId);
      return { success: true, data: stats };
    } catch (err) {
      this.logger.error(`Failed to get pixel stats: ${String(err)}`);
      return { success: false };
    }
  }

  @Post('create-audience')
  async createAudience(@Body() body: { name: string; petitionId: string; eventType: string }) {
    const { name, petitionId, eventType } = body || ({} as any);
    if (!name || !petitionId || !eventType) throw new BadRequestException('name, petitionId and eventType are required');
    const pixelTracking = this.pixelTracking;
    if (!pixelTracking) throw new BadRequestException('pixel tracking unavailable');

    const result = await pixelTracking.createCustomAudience(name, petitionId, eventType);
    return { success: result.success, data: result };
  }

  @Post('validate-url')
  @HttpCode(200)
  async validateUrl(@Body() body: { url: string }) {
    const { url } = body || ({} as any);
    if (!url) throw new BadRequestException('url is required');
    const facebookSdk = this.facebookSdk;
    if (!facebookSdk) throw new BadRequestException('facebook sdk unavailable');

    const result = await facebookSdk.validateShareUrl(url);
    return { success: result.valid, data: result };
  }

  @Get('share-count')
  async getShareCount(@Query('url') url?: string) {
    if (!url) throw new BadRequestException('url query parameter is required');
    const facebookSdk = this.facebookSdk;
    if (!facebookSdk) throw new BadRequestException('facebook sdk unavailable');
    const result = await facebookSdk.getShareCount(url);
    return { success: true, data: result };
  }

  @Get('health')
  async health() {
    try {
      const facebookSdk = this.facebookSdk;
      if (!facebookSdk) throw new BadRequestException('facebook sdk unavailable');
      const status = await facebookSdk.healthCheck();
      return { success: true, data: status };
    } catch (err) {
      this.logger.error(`Facebook SDK health check failed: ${String(err)}`);
      return { success: false };
    }
  }

  // ---------------------------------------------------------------------------
  // Additional endpoints expected by the viral e2e spec
  // ---------------------------------------------------------------------------
  @Post('share')
  @UseGuards(JwtAuthGuard)
  async createShare(
    @Body() body: { petitionId: string },
    @CurrentUser() user: { sub: string },
  ) {
    const { petitionId } = body || ({} as any);
    const userId = user?.sub;

    if (!petitionId) throw new BadRequestException('petitionId is required');
    if (!userId) throw new BadRequestException('Authenticated user required');

    try {
      const result = await this.facebookService.createFacebookShareLink(petitionId, userId);
      return { success: true, data: { shareUrl: result.shareUrl, shortCode: result.shortCode, reachEstimate: result.reachEstimate } };
    } catch (err) {
      this.logger.error(`Failed to create share: ${String(err)}`);
      throw new NotFoundException('Petition not found');
    }
  }

  @Post('track/:shortCode')
  async trackShortCode(@Param('shortCode') shortCode: string) {
    if (!shortCode) throw new BadRequestException('shortCode is required');

    try {
      const redirectUrl = await this.facebookService.trackFacebookClick(shortCode);
      return { success: true, data: { redirectUrl } };
    } catch (err) {
      this.logger.error(`Failed to track click: ${String(err)}`);
      throw new NotFoundException('Share link not found');
    }
  }

  @Get('pixel-report')
  async getPixelReport(@Query('petitionId') petitionId?: string) {
    try {
      const report = await this.pixelService.getPixelReport(petitionId);
      return { success: true, data: report };
    } catch (err) {
      this.logger.error(`Failed to get pixel report: ${String(err)}`);
      return { success: false };
    }
  }
};
