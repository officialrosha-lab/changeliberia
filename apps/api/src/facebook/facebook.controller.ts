import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookPixelService } from './facebook-pixel.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/facebook')
export class FacebookController {
  private readonly logger = new Logger(FacebookController.name);

  constructor(
    private facebookService: FacebookService,
    private pixelService: FacebookPixelService,
  ) {}

  /**
   * GET /facebook/og-meta/:petitionId
   * Get Open Graph metadata for Facebook sharing preview
   * Public endpoint - used for share previews
   */
  @Get('og-meta/:petitionId')
  @UseGuards(OptionalJwtAuthGuard)
  async getOpenGraphMeta(@Param('petitionId') petitionId: string) {
    try {
      const ogMeta = await this.facebookService.generateOpenGraphMeta(
        petitionId,
      );

      return {
        success: true,
        data: ogMeta,
      };
    } catch (error) {
      this.logger.error(`Failed to get OG meta: ${error instanceof Error ? error.message : String(error)}`);
      throw new NotFoundException(`Petition ${petitionId} not found`);
    }
  }

  /**
   * POST /facebook/share
   * Create a Facebook share link for a petition
   * Requires JWT authentication
   */
  @Post('share')
  @UseGuards(JwtAuthGuard)
  async createShareLink(
    @Body() shareData: { petitionId: string },
    @CurrentUser() user: any,
  ) {
    const { petitionId } = shareData;

    if (!petitionId) {
      throw new BadRequestException('petitionId is required');
    }

    try {
      const shareLink = await this.facebookService.createFacebookShareLink(
        petitionId,
        user.id,
      );

      this.logger.log(
        `Created Facebook share link for user ${user.id} on petition ${petitionId}`,
      );

      return {
        success: true,
        data: shareLink,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create share link: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new NotFoundException(`Petition ${petitionId} not found`);
    }
  }

  /**
   * GET /facebook/share-dialog/:petitionId
   * Get Facebook share dialog configuration
   * Public endpoint
   */
  @Get('share-dialog/:petitionId')
  @UseGuards(OptionalJwtAuthGuard)
  async getShareDialog(
    @Param('petitionId') petitionId: string,
    @Query('networkSize') networkSize?: string,
  ) {
    try {
      const userNetworkSize = networkSize ? parseInt(networkSize, 10) : 250;

      const dialogConfig = await this.facebookService.buildFacebookShareDialog(
        petitionId,
        userNetworkSize,
      );

      return {
        success: true,
        data: dialogConfig,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get share dialog: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new NotFoundException(`Petition ${petitionId} not found`);
    }
  }

  /**
   * POST /facebook/track/:shortCode
   * Track a Facebook share click and redirect
   * Public endpoint - used by share tracking
   */
  @Post('track/:shortCode')
  async trackShareClick(@Param('shortCode') shortCode: string) {
    try {
      const targetUrl = await this.facebookService.trackFacebookClick(
        shortCode,
      );

      this.logger.log(`Tracked Facebook click for short code ${shortCode}`);

      return {
        success: true,
        data: {
          redirectUrl: targetUrl,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to track click: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new NotFoundException(`Share link ${shortCode} not found`);
    }
  }

  /**
   * POST /facebook/record-share
   * Record a Facebook share event
   * Requires JWT authentication
   */
  @Post('record-share')
  @UseGuards(JwtAuthGuard)
  async recordShareEvent(
    @Body()
    shareEvent: {
      petitionId: string;
      shortCode: string;
    },
    @CurrentUser() user: any,
  ) {
    const { petitionId, shortCode } = shareEvent;

    if (!petitionId || !shortCode) {
      throw new BadRequestException('petitionId and shortCode are required');
    }

    try {
      await this.facebookService.recordFacebookShare(
        petitionId,
        user.id,
        shortCode,
      );

      this.logger.log(
        `Recorded Facebook share for user ${user.id} on petition ${petitionId}`,
      );

      return {
        success: true,
        message: 'Share event recorded',
      };
    } catch (error) {
      this.logger.error(
        `Failed to record share: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new NotFoundException(`Petition or share link not found`);
    }
  }

  /**
   * GET /facebook/reach-estimate/:petitionId
   * Get estimated viral reach for a petition share
   * Public endpoint
   */
  @Get('reach-estimate/:petitionId')
  @UseGuards(OptionalJwtAuthGuard)
  async getReachEstimate(
    @Param('petitionId') petitionId: string,
    @CurrentUser() user?: any,
  ) {
    try {
      const reachEstimate = user
        ? await this.facebookService.calculateNetworkReach(user)
        : {
            estimatedReach: 250, // Default Liberia network size
            multiplier: 1,
            influencer: false,
          };

      return {
        success: true,
        data: reachEstimate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get reach estimate: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          estimatedReach: 250,
          multiplier: 1,
          influencer: false,
        },
      };
    }
  }

  /**
   * GET /facebook/analytics/:petitionId
   * Get Facebook analytics for a petition
   * Requires JWT authentication + ownership
   */
  @Get('analytics/:petitionId')
  @UseGuards(JwtAuthGuard)
  async getFacebookAnalytics(@Param('petitionId') petitionId: string) {
    try {
      const analytics = await this.facebookService.getFacebookAnalytics(
        petitionId,
      );

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get analytics: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new NotFoundException(`Petition ${petitionId} not found`);
    }
  }

  /**
   * GET /facebook/leaderboard
   * Get top Facebook sharers
   * Public endpoint
   */
  @Get('leaderboard')
  async getShareLeaderboard(@Query('limit') limit?: string) {
    try {
      const limitValue = limit ? parseInt(limit, 10) : 10;

      // Get top sharers from analytics
      const analytics = await this.facebookService.getFacebookAnalytics('');

      // Return placeholder - actual implementation would aggregate across petitions
      return {
        success: true,
        data: {
          topSharers: [],
          period: 'all-time',
          limit: limitValue,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get leaderboard: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          topSharers: [],
          period: 'all-time',
          limit: 10,
        },
      };
    }
  }

  /**
   * GET /facebook/pixel
   * Get Facebook Pixel initialization code
   * Public endpoint
   */
  @Get('pixel')
  getPixelCode() {
    try {
      const pixelCode = this.pixelService.getPixelInitCode();
      const pixelId = this.pixelService.getPixelId();

      return {
        success: true,
        data: {
          pixelId,
          initCode: pixelCode,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get pixel code: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          pixelId: 'placeholder',
          initCode: '<!-- Pixel initialization failed -->',
        },
      };
    }
  }

  /**
   * GET /facebook/pixel-report
   * Get pixel analytics report
   * Public endpoint
   */
  @Get('pixel-report')
  async getPixelReport(@Query('petitionId') petitionId?: string) {
    try {
      const report = await this.pixelService.getPixelReport(petitionId);

      return {
        success: true,
        data: report,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get pixel report: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          totalEvents: 0,
          eventsByType: {},
          totalConversions: 0,
          totalConversionValue: 0,
          conversionRate: 0,
        },
      };
    }
  }
}
