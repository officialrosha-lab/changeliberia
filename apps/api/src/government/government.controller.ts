import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { GovernmentService } from './government.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('government')
export class GovernmentController {
  private readonly logger = new Logger(GovernmentController.name);

  constructor(private governmentService: GovernmentService) {}

  /**
   * POST /government/submit
   * Submit a petition to government/NGO
   * Requires JWT authentication and 1000+ signatures
   */
  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submitPetition(
    @Body() submitData: { petitionId: string; governmentEmail: string; notes?: string },
    @CurrentUser() user: any,
  ) {
    const { petitionId, governmentEmail, notes } = submitData;

    if (!petitionId || !governmentEmail) {
      throw new BadRequestException('petitionId and governmentEmail are required');
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(governmentEmail)) {
      throw new BadRequestException('Invalid email address');
    }

    try {
      const submission = await this.governmentService.submitToGovernment(
        petitionId,
        governmentEmail,
        notes,
      );

      this.logger.log(`Petition ${petitionId} submitted by user ${user.id}`);

      return {
        success: true,
        message: 'Petition submitted successfully',
        submission,
      };
    } catch (error) {
      this.logger.error(`Submission failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * GET /government/status/:petitionId
   * Get submission status for a petition
   * Public endpoint but provides more details for authenticated users
   */
  @Get('status/:petitionId')
  @UseGuards(OptionalJwtAuthGuard)
  async getPetitionStatus(@Param('petitionId') petitionId: string) {
    try {
      const submissions = await this.governmentService.getPetitionSubmissions(
        petitionId,
      );

      if (submissions.length === 0) {
        return {
          petitionId,
          submitted: false,
          status: 'NOT_SUBMITTED',
          message: 'This petition has not been submitted yet',
        };
      }

      const latestSubmission = submissions[0];

      return {
        petitionId,
        submitted: true,
        status: latestSubmission.status,
        submittedAt: latestSubmission.submittedAt,
        updatedAt: latestSubmission.updatedAt,
        submissions,
      };
    } catch (error) {
      this.logger.error(`Status check failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * GET /government/report/:petitionId
   * Download PDF report for a petition
   * Government/NGO petitions are restricted to the petition creator.
   */
  @Get('report/:petitionId')
  @UseGuards(OptionalJwtAuthGuard)
  async getPetitionReport(
    @Param('petitionId') petitionId: string,
    @Res() res: Response,
    @CurrentUser() user: any,
  ) {
    try {
      const reportBuffer = await this.governmentService.generatePetitionReport(
        petitionId,
        user?.userId,
        true,
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="petition-${petitionId}.pdf"`,
      );
      res.send(reportBuffer);
    } catch (error) {
      this.logger.error(`Report generation failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * GET /government/submissions
   * Get all submissions for the current user
   * Requires JWT authentication
   */
  @Get('submissions')
  @UseGuards(JwtAuthGuard)
  async getMySubmissions(@CurrentUser() user: any) {
    try {
      const submissions = await this.governmentService.getUserSubmissions(user.id);

      return {
        success: true,
        count: submissions.length,
        submissions,
      };
    } catch (error) {
      this.logger.error(`Submission retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * GET /government/contacts
   * Get available government contacts for submission
   * Public endpoint
   */
  @Get('contacts')
  async getGovernmentContacts() {
    try {
      const contacts = await this.governmentService.getGovernmentContacts();

      return {
        success: true,
        count: contacts.length,
        contacts,
      };
    } catch (error) {
      this.logger.error(`Contact retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * POST /government/contacts (ADMIN ONLY)
   * Create/register a new government contact
   * Requires admin role
   */
  @Post('contacts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createGovernmentContact(
    @Body()
    contactData: {
      name: string;
      email: string;
      phone?: string;
      category: string;
      region?: string;
      priority: number;
    },
  ) {
    if (!contactData.name || !contactData.email || !contactData.category) {
      throw new BadRequestException(
        'name, email, and category are required',
      );
    }

    try {
      const contact = await this.governmentService.createGovernmentContact(
        contactData,
      );

      return {
        success: true,
        message: 'Government contact created',
        contact,
      };
    } catch (error) {
      this.logger.error(`Contact creation failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * POST /government/status/:petitionId (ADMIN ONLY)
   * Update submission status (for government to confirm receipt)
   * Requires admin role
   */
  @Post('status/:petitionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateSubmissionStatus(
    @Param('petitionId') petitionId: string,
    @Body() updateData: { status: string },
  ) {
    if (!updateData.status) {
      throw new BadRequestException('status is required');
    }

    const validStatuses = [
      'SUBMITTED',
      'ACKNOWLEDGED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
    ];
    if (!validStatuses.includes(updateData.status)) {
      throw new BadRequestException(`Invalid status: ${updateData.status}`);
    }

    try {
      const updated = await this.governmentService.trackPetitionStatus(
        petitionId,
        updateData.status as any,
      );

      this.logger.log(`Petition ${petitionId} status updated to ${updateData.status}`);

      return {
        success: true,
        message: 'Status updated successfully',
        submission: updated,
      };
    } catch (error) {
      this.logger.error(`Status update failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * GET /government/stats (ADMIN ONLY)
   * Get submission statistics
   * Requires admin role
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getSubmissionStats() {
    try {
      const stats = await this.governmentService.getSubmissionStats();

      return {
        success: true,
        stats,
      };
    } catch (error) {
      this.logger.error(`Stats retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
