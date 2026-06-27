import { ForbiddenException, Injectable, Logger, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { SubmissionStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { SignatureAddedEvent } from '../events/domain-events';
import PDFDocument from 'pdfkit';

@Injectable()
export class GovernmentService {
  private readonly logger = new Logger(GovernmentService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() private emailService: EmailService | null = null,
  ) {}

  /**
   * Generate a comprehensive PDF report for a petition
   */
  async generatePetitionReport(
    petitionId: string,
    requestorId?: string,
    enforceCreator = false,
  ): Promise<Buffer> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      include: {
        creator: true,
        signatures: { orderBy: { createdAt: 'asc' } },
        milestones: { orderBy: { targetValue: 'asc' } },
      },
    });

    if (!petition) {
      throw new NotFoundException(`Petition with ID ${petitionId} not found`);
    }

    if (enforceCreator) {
      if (!requestorId) {
        throw new ForbiddenException('Authentication is required to download this petition report');
      }
      if (petition.creatorId !== requestorId) {
        throw new ForbiddenException('Only the petition creator may download this petition report');
      }
    }

    const progressPercent = Math.round((petition.signaturesCount / petition.goal) * 100);
    const governmentReady = petition.signaturesCount >= 1000;
    const dailyBreakdown = this.aggregateSignaturesByDay(petition.signatures);
    const breakdownEntries = Object.entries(dailyBreakdown).slice(-14);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    doc.fillColor('#0f172a').fontSize(20).text('CHANGE LIBERIA', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#475569').text(`Report generated: ${this.formatDate(new Date())}`, {
      align: 'center',
    });
    doc.moveDown(1);

    doc.fontSize(16).fillColor('#111827').text(petition.title);
    doc.moveDown(0.5);

    doc.fontSize(11).fillColor('#334155').text(petition.summary, { width: 500, lineGap: 3 });
    doc.moveDown(0.5);
    doc.text(petition.description, { width: 500, lineGap: 3 });
    doc.moveDown(1);

    const leftColWidth = 260;

    doc.fontSize(12).fillColor('#0f172a').text('Petition details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Type: ${this.textOrEmpty(petition.petitionType || 'General')}`, { width: leftColWidth });
    doc.text(`Category: ${this.textOrEmpty(petition.category)}`, { width: leftColWidth });
    doc.text(`County: ${this.textOrEmpty(petition.county)}`, { width: leftColWidth });
    doc.text(`Goal: ${petition.goal.toLocaleString()}`, { width: leftColWidth });
    doc.text(`Signatures: ${petition.signaturesCount.toLocaleString()}`, { width: leftColWidth });
    doc.text(`Progress: ${progressPercent}%`, { width: leftColWidth });
    doc.text(`Government-ready: ${governmentReady ? 'Yes' : 'No'}`, { width: leftColWidth });
    if (!governmentReady) {
      doc.text(`Signatures needed: ${(1000 - petition.signaturesCount).toLocaleString()}`, {
        width: leftColWidth,
      });
    }
    doc.moveDown(0.5);

    doc.text(`Creator name: ${this.textOrEmpty(petition.creator?.fullName)}`, {
      width: leftColWidth,
    });
    doc.text(`Creator email: ${this.textOrEmpty(petition.creator?.email)}`, {
      width: leftColWidth,
    });
    doc.text(`Creator phone: ${this.textOrEmpty(petition.creator?.phone)}`, {
      width: leftColWidth,
    });
    doc.moveDown(0.5);
    doc.text(`Prior actions: ${this.textOrEmpty(petition.priorActions, 'None recorded')}`, {
      width: 500,
      lineGap: 3,
    });
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#0f172a').text('Milestones', { underline: true });
    doc.moveDown(0.5);
    if (petition.milestones.length === 0) {
      doc.fontSize(10).fillColor('#334155').text('No milestones defined for this petition.');
    } else {
      petition.milestones.forEach((milestone, index) => {
        doc.fontSize(10).fillColor('#334155').text(
          `${index + 1}. ${milestone.targetValue.toLocaleString()} signatures — ${milestone.achieved ? 'ACHIEVED' : 'PENDING'}${milestone.achievedAt ? ` (${this.formatDate(milestone.achievedAt)})` : ''}`,
          { width: 500, lineGap: 2 },
        );
      });
    }
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#0f172a').text('Recent signature activity', { underline: true });
    doc.moveDown(0.5);
    if (breakdownEntries.length === 0) {
      doc.fontSize(10).fillColor('#334155').text('No signature activity recorded yet.');
    } else {
      breakdownEntries.forEach(([date, count]) => {
        doc.fontSize(10).fillColor('#334155').text(`${date}: ${count.toLocaleString()} signatures`, {
          width: 500,
          lineGap: 2,
        });
      });
    }
    doc.moveDown(1);

    doc.addPage();
    doc.fontSize(16).fillColor('#111827').text('Signature ledger', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#334155');
    doc.text(
      `Showing all ${petition.signatures.length.toLocaleString()} signer records.`,
      { width: 500 },
    );
    doc.moveDown(0.5);

    petition.signatures.forEach((signature, index) => {
      if (doc.y > 720) doc.addPage();
      const signerName = signature.anonymous ? 'Anonymous' : this.textOrEmpty(signature.name);
      doc.fontSize(10).text(`${index + 1}. ${signerName}`, 50, doc.y, {
        width: 260,
        continued: true,
      });
      doc.text(this.formatDate(signature.createdAt), 320, doc.y, {
        width: 200,
        align: 'right',
      });
    });

    doc.addPage();
    doc.fontSize(10).fillColor('#64748b').text(
      'This report was automatically generated by Change Liberia. For questions or corrections, contact support or review the petition details in the administrator dashboard.',
      { width: 500, align: 'center' },
    );

    // Add title to PDF metadata so tests can reliably assert presence
    doc.info.Title = petition.title;

    doc.end();
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  private textOrEmpty(value: string | null | undefined, fallback = 'Not specified'): string {
    return value?.trim() ? value : fallback;
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Generate a CSV export of all signatures for a petition (creator-only)
   */
  async generateSignaturesCsv(petitionId: string, requestorId: string): Promise<string> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      include: {
        signatures: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { county: true, verificationStatus: true } } },
        },
      },
    });

    if (!petition) {
      throw new NotFoundException(`Petition with ID ${petitionId} not found`);
    }
    if (petition.creatorId !== requestorId) {
      throw new ForbiddenException('Only the petition creator may export signatures');
    }

    const csvEscape = (val: string | null | undefined) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    const header = ['#', 'Name', 'Anonymous', 'Date Signed', 'County', 'Verification', 'Trust Score'].join(',');
    const rows = petition.signatures.map((sig, i) =>
      [
        i + 1,
        csvEscape(sig.anonymous ? 'Anonymous' : sig.name),
        sig.anonymous ? 'Yes' : 'No',
        csvEscape(this.formatDate(sig.createdAt)),
        csvEscape(sig.user?.county ?? ''),
        csvEscape(sig.user?.verificationStatus ?? ''),
        sig.trustScoreSnapshot,
      ].join(','),
    );

    return [header, ...rows].join('\n');
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

    if (petition.signaturesCount < 1000) {
      throw new BadRequestException(
        'Petition must have at least 1000 signatures to submit to government',
      );
    }

    // Generate report
    await this.generatePetitionReport(petitionId);

    const documentUrl = `petition-${petitionId}.pdf`;

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
        pdfUrl: documentUrl,
      },
    });
    // Ensure TypeScript knows petition is non-null across awaits
    const petitionNonNull = petition as NonNullable<typeof petition>;

    this.logger.log(
      `Petition ${petitionId} submitted to ${governmentEmail} with ${petitionNonNull.signaturesCount} signatures`,
    );

    const emailSent = await this.sendGovernmentSubmissionEmail(
      petitionNonNull,
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

    return { ...submission, documentUrl };
  }

  /**
   * Track petition submission status
   */
  async trackPetitionStatus(petitionId: string, status: SubmissionStatus): Promise<any> {
    const submission = await this.prisma.petitionSubmission.findFirst({
      where: { petitionId },
      orderBy: { createdAt: 'desc' },
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
      return false;
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
    try {
      return await this.prisma.governmentContact.create({ data });
    } catch (error: any) {
      // Unique constraint on email — return existing contact without overwriting its fields
      if (error?.code === 'P2002') {
        return this.prisma.governmentContact.findUnique({ where: { email: data.email } });
      }
      throw error;
    }
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
    byStatus: Record<string, number>;
    byMinistry: Record<string, number>;
    submitted: number;
    acknowledged: number;
    underReview: number;
    approved: number;
    rejected: number;
    emailFailed: number;
  }> {
    const statusGroups = await this.prisma.petitionSubmission.groupBy({
      by: ['status'],
      _count: true,
    });

    const ministryGroups = await this.prisma.petitionSubmission.groupBy({
      by: ['governmentEmail'],
      _count: true,
    });

    const byStatus: Record<string, number> = {
      SUBMITTED: 0,
      ACKNOWLEDGED: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      EMAIL_FAILED: 0,
    };

    let totalSubmissions = 0;
    statusGroups.forEach((group) => {
      totalSubmissions += group._count;
      byStatus[group.status] = group._count;
    });

    const byMinistry: Record<string, number> = {};
    ministryGroups.forEach((group) => {
      const ministryKey = group.governmentEmail;
      byMinistry[ministryKey] = group._count;
    });

    return {
      totalSubmissions,
      byStatus,
      byMinistry,
      submitted: byStatus.SUBMITTED,
      acknowledged: byStatus.ACKNOWLEDGED,
      underReview: byStatus.UNDER_REVIEW,
      approved: byStatus.APPROVED,
      rejected: byStatus.REJECTED,
      emailFailed: byStatus.EMAIL_FAILED,
    };
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
