import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { GrowthService } from './growth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('growth')
export class GrowthController {
  private readonly logger = new Logger(GrowthController.name);

  constructor(
    private readonly growthService: GrowthService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /growth/trending
   * Gets trending petitions
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get('trending')
  async getTrendingPetitions(
    @Query('limit') limit?: string,
    @Query('county') county?: string,
  ) {
    try {
      const petitions = await this.growthService.getTrendingPetitions(
        parseInt(limit || '10'),
        county,
      );

      return {
        success: true,
        count: petitions.length,
        petitions,
      };
    } catch (error) {
      this.logger.error('Failed to get trending petitions', error);
      throw new BadRequestException('Failed to get trending petitions');
    }
  }

  /**
   * GET /growth/leaderboard/:county
   * Gets county-based leaderboard
   */
  @Get('leaderboard/:county')
  async getCountyLeaderboard(
    @Param('county') county: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const leaderboard = await this.growthService.getCountyLeaderboard(
        county,
        parseInt(limit || '10'),
      );

      return {
        success: true,
        county,
        leaderboard,
      };
    } catch (error) {
      this.logger.error('Failed to get leaderboard', error);
      throw new BadRequestException('Failed to get leaderboard');
    }
  }

  /**
   * GET /growth/petition/:petitionId/metrics
   * Gets growth metrics for a petition
   */
  @Get('petition/:petitionId/metrics')
  async getPetitionMetrics(@Param('petitionId') petitionId: string) {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
      });

      if (!petition) {
        throw new NotFoundException('Petition not found');
      }

      const metrics = await this.growthService.getPetitionGrowthMetrics(petitionId);

      return {
        success: true,
        metrics,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to get metrics', error);
      throw new BadRequestException('Failed to get metrics');
    }
  }

  /**
   * GET /growth/petition/:petitionId/milestones
   * Gets all milestones for a petition
   */
  @Get('petition/:petitionId/milestones')
  async getPetitionMilestones(@Param('petitionId') petitionId: string) {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
      });

      if (!petition) {
        throw new NotFoundException('Petition not found');
      }

      const milestones = await this.growthService.getPetitionMilestones(petitionId);

      return {
        success: true,
        count: milestones.length,
        milestones,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to get milestones', error);
      throw new BadRequestException('Failed to get milestones');
    }
  }

  /**
   * GET /growth/petition/:petitionId/government-readiness
   * Gets government readiness status
   */
  @Get('petition/:petitionId/government-readiness')
  async getGovernmentReadiness(@Param('petitionId') petitionId: string) {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
      });

      if (!petition) {
        throw new NotFoundException('Petition not found');
      }

      const readiness = await this.growthService.getGovernmentReadinessStatus(petitionId);

      return {
        success: true,
        readiness,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to get readiness status', error);
      throw new BadRequestException('Failed to get readiness status');
    }
  }

  /**
   * GET /growth/petition/:petitionId/share-trigger
   * Checks if share modal should be triggered
   */
  @Get('petition/:petitionId/share-trigger')
  async checkShareTrigger(@Param('petitionId') petitionId: string) {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
      });

      if (!petition) {
        throw new NotFoundException('Petition not found');
      }

      const shouldTrigger = await this.growthService.shouldTriggerShareModal(petitionId);

      return {
        success: true,
        shouldTriggerShareModal: shouldTrigger,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to check share trigger', error);
      throw new BadRequestException('Failed to check share trigger');
    }
  }

  /**
   * POST /growth/petition/:petitionId/check-milestone
   * Admin endpoint: manually trigger milestone check
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('petition/:petitionId/check-milestone')
  async checkMilestone(@Param('petitionId') petitionId: string) {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
      });

      if (!petition) {
        throw new NotFoundException('Petition not found');
      }

      const newMilestones = await this.growthService.checkAndCreateMilestone(
        petitionId,
        petition.signaturesCount,
      );

      return {
        success: true,
        newMilestonesCreated: newMilestones.length,
        milestones: newMilestones,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to check milestone', error);
      throw new BadRequestException('Failed to check milestone');
    }
  }

  /**
   * POST /growth/petition/:petitionId/recalculate-milestones
   * Admin endpoint: recalculate all milestones
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('petition/:petitionId/recalculate-milestones')
  async recalculateMilestones(@Param('petitionId') petitionId: string) {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
      });

      if (!petition) {
        throw new NotFoundException('Petition not found');
      }

      const milestones = await this.growthService.recalculateMilestones(petitionId);

      return {
        success: true,
        count: milestones.length,
        milestones,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to recalculate milestones', error);
      throw new BadRequestException('Failed to recalculate milestones');
    }
  }
}
