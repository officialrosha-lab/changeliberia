import { Injectable, Logger, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { SubmissionStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { SignatureAddedEvent } from '../events/domain-events';

@Injectable()
export class GovernmentService {
  private readonly logger = new Logger(GovernmentService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() private emailService: EmailService | null = null,
  ) {}

  /**
   * Generate a comprehensive HTML report for a petition
   */
  async generatePetitionReport(petitionId: string): Promise<Buffer> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      include: {
        creator: true,
        signatures: { take: 50 },
        milestones: { orderBy: { targetValue: 'asc' } },
      },
    });

    if (!petition) {
      throw new NotFoundException(`Petition with ID ${petitionId} not found`);
    }

    // Generate HTML report
    const report = this.generateHTMLReport(petition);
    return Buffer.from(report, 'utf-8');
  }

  /**
   * Generate HTML report for petition
   */
  private generateHTMLReport(petition: any): string {
    const progressPercent = Math.round((petition.signaturesCount / petition.goal) * 100);
    const governmentReady = petition.signaturesCount >= 1000;

    const dailyBreakdown = this.aggregateSignaturesByDay(petition.signatures);
    const dailyBreakdownHtml = Object.entries(dailyBreakdown)
      .map(([date, count]: [string, any]) => `<tr><td>${date}</td><td>${count}</td></tr>`)
      .join('');

    const milestonesHtml = petition.milestones
      .map(
        (m: any, idx: number) =>
          `<tr><td>${idx + 1}</td><td>${m.targetValue} signatures</td><td>${m.achieved ? 'ACHIEVED' : 'PENDING'}</td><td>${m.achievedAt ? m.achievedAt.toLocaleDateString() : 'N/A'}</td></tr>`,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    .header { text-align: center; margin-bottom: 30px; }
    .metric { display: inline-block; margin: 15px 20px; padding: 15px 20px; background: #ecf0f1; border-radius: 5px; }
    .metric-label { font-size: 12px; color: #7f8c8d; }
    .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #3498db; color: white; padding: 10px; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #bdc3c7; }
    tr:nth-child(even) { background: #ecf0f1; }
    .status-ready { color: #27ae60; font-weight: bold; }
    .status-not-ready { color: #e74c3c; font-weight: bold; }
    .progress-bar { width: 100%; height: 30px; background: #ecf0f1; border-radius: 15px; overflow: hidden; margin: 10px 0; }
    .progress-fill { height: 100%; background: #27ae60; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #bdc3c7; font-size: 12px; color: #7f8c8d; text-align: center; }
    .creator-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🇱🇷 CHANGE LIBERIA</h1>
    <h2>Citizen Petition Report</h2>
    <p><small>Generated: ${new Date().toLocaleString()}</small></p>
  </div>

  <h2>${petition.title}</h2>

  <div class="metric">
    <div class="metric-label">Total Signatures</div>
    <div class="metric-value">${petition.signaturesCount}</div>
  </div>

  <div class="metric">
    <div class="metric-label">Goal</div>
    <div class="metric-value">${petition.goal}</div>
  </div>

  <div class="metric">
    <div class="metric-label">Progress</div>
    <div class="metric-value">${progressPercent}%</div>
  </div>

  <div class="progress-bar">
    <div class="progress-fill" style="width: ${Math.min(progressPercent, 100)}%">${progressPercent}%</div>
  </div>

  <h2>Petition Summary</h2>
  <p>${petition.summary}</p>
  <p>${petition.description}</p>

  <h2>Petition Creator</h2>
  <div class="creator-info">
    <p><strong>Name:</strong> ${petition.creator.fullName}</p>
    <p><strong>Phone:</strong> ${petition.creator.phone}</p>
    <p><strong>Email:</strong> ${petition.creator.email || 'Not provided'}</p>
  </div>

  <h2>Milestones Achieved</h2>
  <table>
    <tr>
      <th>#</th>
      <th>Target Signatures</th>
      <th>Status</th>
      <th>Achieved Date</th>
    </tr>
    ${milestonesHtml}
  </table>

  <h2>Recent Activity (Last 7 Days)</h2>
  <table>
    <tr>
      <th>Date</th>
      <th>Signatures</th>
    </tr>
    ${dailyBreakdownHtml}
  </table>

  <h2>Government Submission Status</h2>
  <p>
    Status: <span class="${governmentReady ? 'status-ready' : 'status-not-ready'}">
      ${governmentReady ? '✅ READY FOR SUBMISSION' : '⏳ NOT YET READY'}
    </span>
  </p>
  ${!governmentReady ? `<p>Signatures needed: ${1000 - petition.signaturesCount}</p>` : ''}

  <div class="footer">
    <p>This report was automatically generated by Change Liberia.</p>
    <p>For more information, visit <strong>changelib.org</strong></p>
    <p>Report ID: ${petition.id}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Submit petition to government/NGO
   */
  async submitToGovernment(
    petitionId: string,
    governmentEmail: string,
    additionalNotes?: string,
  ): Promise<any> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      include: { creator: true },
    });

    if (!petition) {
      throw new NotFoundException(`Petition with ID ${petitionId} not found`);
    }

    // Check if already submitted
    const existingSubmission = await this.prisma.petitionSubmission.findFirst({
      where: {
        petitionId,
        status: SubmissionStatus.SUBMITTED,
      },
    });

    if (existingSubmission) {
      throw new BadRequestException('Petition has already been submitted');
    }

    // Generate report
    await this.generatePetitionReport(petitionId);

    // Create submission record
    const submission = await this.prisma.petitionSubmission.create({
      data: {
        petitionId,
        governmentEmail,
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
        submittedBy: petition.creatorId,
        notes: additionalNotes,
        signatureCount: petition.signaturesCount,
      },
    });

    this.logger.log(
      `Petition ${petitionId} submitted to ${governmentEmail} with ${petition.signaturesCount} signatures`,
    );

    const emailSent = await this.sendGovernmentSubmissionEmail(
      petition,
      governmentEmail,
      additionalNotes,
    );

    if (!emailSent) {
      await this.prisma.petitionSubmission.update({
        where: { id: submission.id },
        data: {
          status: SubmissionStatus.EMAIL_FAILED,
          responseNotes: 'Government submission email failed to deliver',
        },
      });
    }

    return submission;
  }

  /**
   * Track petition submission status
   */
  async trackPetitionStatus(petitionId: string, status: SubmissionStatus): Promise<any> {
    const submission = await this.prisma.petitionSubmission.findFirst({
      where: { petitionId, status: SubmissionStatus.SUBMITTED },
    });

    if (!submission) {
      throw new NotFoundException(`No active submission found for petition ${petitionId}`);
    }

    // Valid statuses from the enum
    const validStatuses = Object.values(SubmissionStatus);
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const updated = await this.prisma.petitionSubmission.update({
      where: { id: submission.id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Petition ${petitionId} status updated to ${status}`);

    return updated;
  }

  /**
   * Auto-classify petition based on signature count
   * Returns true if petition should be auto-submitted
   */
  async autoClassifyPetition(petitionId: string): Promise<boolean> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });

    if (!petition) {
      throw new NotFoundException(`Petition with ID ${petitionId} not found`);
    }

    // Auto-submit at 1000+ signatures
    if (petition.signaturesCount >= 1000) {
      const submission = await this.prisma.petitionSubmission.findFirst({
        where: { petitionId },
      });

      if (!submission) {
        const contacts = await this.getGovernmentContacts('MINISTRY');

        if (contacts && contacts.length > 0) {
          await this.submitToGovernment(
            petitionId,
            contacts[0].email,
            'Auto-submitted when reaching 1000 signatures',
          );
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get submission history for a petition
   */
  async getPetitionSubmissions(petitionId: string): Promise<any[]> {
    return this.prisma.petitionSubmission.findMany({
      where: { petitionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get government contacts (can be filtered by region or category)
   */
  async getGovernmentContacts(category?: string): Promise<any[]> {
    const where = category ? { category, isActive: true } : { isActive: true };

    return this.prisma.governmentContact.findMany({
      where,
      orderBy: { priority: 'desc' },
    });
  }

  @OnEvent('SIGNATURE_ADDED')
  async handleSignatureAdded(event: SignatureAddedEvent): Promise<void> {
    try {
      await this.autoClassifyPetition(event.petitionId);
    } catch (error) {
      this.logger.error(
        `Failed to auto-submit petition ${event.petitionId} after signature event: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async sendGovernmentSubmissionEmail(
    petition: any,
    governmentEmail: string,
    notes?: string,
  ): Promise<boolean> {
    const subject = `Government petition submission: ${petition.title}`;
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { padding: 20px; }
    .header { background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 22px; color: #065f46; }
    .section { margin-bottom: 18px; }
    .label { font-weight: 700; color: #111827; }
    .value { margin-top: 4px; color: #374151; }
    .footer { color: #6b7280; font-size: 13px; margin-top: 24px; }
    .pill { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #d1fae5; color: #065f46; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New petition submission to government</h1>
      <p class="value">This petition has reached government-readiness and is being submitted for review.</p>
    </div>
    <div class="section">
      <div class="label">Petition title</div>
      <div class="value">${this.escapeHtml(petition.title)}</div>
    </div>
    <div class="section">
      <div class="label">Signature count</div>
      <div class="pill">${petition.signaturesCount.toLocaleString()}</div>
    </div>
    <div class="section">
      <div class="label">Creator</div>
      <div class="value">${this.escapeHtml(petition.creator?.fullName || 'Unknown')} (${this.escapeHtml(petition.creator?.email || 'No email')})</div>
    </div>
    <div class="section">
      <div class="label">Notes</div>
      <div class="value">${this.escapeHtml(notes || 'No additional notes provided.')}</div>
    </div>
    <div class="footer">
      This message was auto-generated by the Change Liberia platform.
    </div>
  </div>
</body>
</html>`;
    const textContent = `Petition: ${petition.title}\nSignatures: ${petition.signaturesCount}\nCreator: ${petition.creator?.fullName || 'Unknown'} (${petition.creator?.email || 'No email'})\nNotes: ${notes || 'No additional notes provided.'}`;

    if (!this.emailService) {
      this.logger.error('EmailService not available - cannot send petition submission email');
      return;
    }

    return this.emailService.sendEmail({
      templateType: 'petition_to_institution',
      recipientEmail: governmentEmail,
      recipientName: petition.creator?.fullName || 'Government contact',
      subject,
      htmlContent,
      textContent,
      data: {
        petitionId: petition.id,
        signatureCount: petition.signaturesCount,
        notes,
      },
    });
  }

  private escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Create/update government contact (admin only)
   */
  async createGovernmentContact(data: {
    name: string;
    email: string;
    phone?: string;
    category: string;
    region?: string;
    priority: number;
  }): Promise<any> {
    return this.prisma.governmentContact.create({
      data,
    });
  }

  /**
   * Get all submissions for a user
   */
  async getUserSubmissions(userId: string): Promise<any[]> {
    return this.prisma.petitionSubmission.findMany({
      where: { submittedBy: userId },
      include: { petition: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get submission statistics
   */
  async getSubmissionStats(): Promise<{
    totalSubmissions: number;
    submitted: number;
    acknowledged: number;
    underReview: number;
    approved: number;
    rejected: number;
  }> {
    const submissions = await this.prisma.petitionSubmission.groupBy({
      by: ['status'],
      _count: true,
    });

    const stats = {
      totalSubmissions: 0,
      submitted: 0,
      acknowledged: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
    };

    submissions.forEach((group) => {
      stats.totalSubmissions += group._count;
      const statusKey = group.status.toLowerCase();
      (stats as any)[statusKey] = group._count;
    });

    return stats;
  }

  /**
   * Helper: Aggregate signatures by day
   */
  private aggregateSignaturesByDay(signatures: { createdAt: Date }[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    signatures.forEach((sig) => {
      const dateStr = sig.createdAt.toLocaleDateString();
      breakdown[dateStr] = (breakdown[dateStr] || 0) + 1;
    });

    return breakdown;
  }
}
