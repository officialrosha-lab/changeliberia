import { Injectable, Logger, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { RoutingResult } from '../routing/smart-routing.service';
import { PetitionStatus } from '@prisma/client';

/**
 * Petition Email Service
 * Handles sending routed petitions to institution contacts
 * Integrates with SmartRoutingService and EmailService
 */
@Injectable()
export class PetitionEmailService {
  private readonly logger = new Logger(PetitionEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly emailService: EmailService | null,
  ) {}

  /**
   * Event listener for petition routing
   * Triggered when a petition is approved and routed to an institution
   */
  @OnEvent('petition.routed', { async: true })
  async handlePetitionRouted(payload: {
    petitionId: string;
    routingResult: RoutingResult;
  }) {
    try {
      await this.sendPetitionToInstitution(
        payload.petitionId,
        payload.routingResult,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle petition.routed event for petition ${payload.petitionId}:`,
        (error as Error).stack,
      );
    }
  }

  /**
   * Send petition to institution contacts with email
   * @param petitionId - ID of the petition to send
   * @param routingResult - Routing result containing institution and email info
   */
  async sendPetitionToInstitution(
    petitionId: string,
    routingResult: RoutingResult,
  ): Promise<void> {
    try {
      // Fetch petition details
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
        include: {
          creator: { select: { fullName: true, email: true } },
        },
      });

      if (!petition) {
        this.logger.warn(`Petition not found: ${petitionId}`);
        return;
      }

      // Fetch institution details
      const institution = await this.prisma.institution.findUnique({
        where: { id: routingResult.institutionId },
        include: {
          departments: true,
          contacts: true,
        },
      });

      if (!institution) {
        this.logger.warn(
          `Institution not found: ${routingResult.institutionId}`,
        );
        return;
      }

      // Parse recipient emails from routing result
      const recipientEmails = routingResult.recipientEmails || [];
      const ccEmails = routingResult.ccEmails || [];

      if (recipientEmails.length === 0) {
        this.logger.warn(
          `No recipient emails found for petition ${petitionId}`,
        );
        return;
      }

      // Generate petition summary and email content
      const petitionSummary = this.generatePetitionSummary(petition);
      const emailContent = this.generateEmailContent(
        petition,
        petitionSummary,
        institution,
        routingResult,
      );

      // Send email to each recipient
      for (const recipientEmail of recipientEmails) {
        try {
          if (!this.emailService) {
            this.logger.warn('EmailService not available - cannot send petition email');
            continue;
          }

          const success = await this.emailService.sendEmail({
            templateType: 'petition_to_institution',
            recipientEmail,
            recipientName: institution.contactPerson || institution.name,
            subject: `New Petition Submission: ${petition.title}`,
            htmlContent: emailContent.html,
            textContent: emailContent.text,
            data: {
              petitionId,
              institutionId: routingResult.institutionId,
              recipientEmails,
              ccEmails,
              signatureCount: petition.signaturesCount,
            },
          });

          if (success) {
            this.logger.log(
              `Email sent successfully for petition ${petitionId} to ${recipientEmail}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to send email to ${recipientEmail} for petition ${petitionId}:`,
            (error as Error).message,
          );
        }
      }

      // Send CC emails if any
      if (ccEmails.length > 0 && this.emailService) {
        for (const ccEmail of ccEmails) {
          try {
            await this.emailService.sendEmail({
              templateType: 'petition_to_institution',
              recipientEmail: ccEmail,
              recipientName: 'CC Recipient',
              subject: `[CC] New Petition Submission: ${petition.title}`,
              htmlContent: emailContent.html,
              textContent: emailContent.text,
              data: {
                petitionId,
                institutionId: routingResult.institutionId,
                cc: true,
              },
            });
          } catch (error) {
            this.logger.error(
              `Failed to send CC email to ${ccEmail} for petition ${petitionId}:`,
              (error as Error).message,
            );
          }
        }
      }

      // Update RoutingLog with email sent timestamp
      await this.prisma.routingLog.updateMany({
        where: { petitionId },
        data: { emailSentAt: new Date() },
      });

      this.logger.log(
        `Petition ${petitionId} routed and emails sent to institution ${routingResult.institutionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending petition to institution:`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Generate petition summary text
   */
  private generatePetitionSummary(petition: any): string {
    const lines = [
      petition.title,
      '',
      petition.description || 'No description provided',
    ];

    if (petition.category) {
      lines.push(`\nCategory: ${petition.category}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate formatted email content (HTML and text)
   */
  private generateEmailContent(
    petition: any,
    summary: string,
    institution: any,
    routingResult: RoutingResult,
  ): { html: string; text: string } {
    const signatureCount = petition.signaturesCount || 0;
    const creatorName = petition.creator?.fullName || 'Anonymous';
    const creatorEmail = petition.creator?.email || 'N/A';

    // HTML content
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .petition-title { font-size: 18px; font-weight: bold; margin: 10px 0; }
    .details { background-color: #f1f1f1; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; }
    .detail-row { margin: 8px 0; }
    .label { font-weight: bold; color: #555; }
    .footer { font-size: 12px; color: #999; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Petition Submission</h2>
      <p>A new petition has been submitted and routed to your institution for action.</p>
    </div>

    <div class="details">
      <div class="petition-title">${this.escapeHtml(petition.title)}</div>
      
      <div class="detail-row">
        <span class="label">Petition ID:</span> ${this.escapeHtml(petition.id)}
      </div>

      <div class="detail-row">
        <span class="label">Status:</span> ${petition.status}
      </div>

      <div class="detail-row">
        <span class="label">Signatures:</span> ${signatureCount}
      </div>

      <div class="detail-row">
        <span class="label">Category:</span> ${petition.category ? this.escapeHtml(petition.category) : 'Not specified'}
      </div>

      <div class="detail-row">
        <span class="label">Created By:</span> ${this.escapeHtml(creatorName)} (${this.escapeHtml(creatorEmail)})
      </div>

      ${petition.createdAt ? `<div class="detail-row"><span class="label">Submitted:</span> ${new Date(petition.createdAt).toLocaleDateString()}</div>` : ''}
    </div>

    <div style="margin: 20px 0;">
      <h3>Petition Description</h3>
      <p>${this.escapeHtml(petition.description || 'No description provided').replace(/\n/g, '<br>')}</p>
    </div>

    <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4>Routing Information</h4>
      <p><strong>Institution:</strong> ${this.escapeHtml(institution.name)}</p>
      <p><strong>Contact Email:</strong> ${this.escapeHtml(routingResult.recipientEmails?.[0] || 'N/A')}</p>
      <p><strong>Routing Decision:</strong> ${this.escapeHtml(routingResult.decision)}</p>
      ${routingResult.notes ? `<p><strong>Notes:</strong> ${this.escapeHtml(routingResult.notes)}</p>` : ''}
    </div>

    <div style="margin: 20px 0;">
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Review the petition and signatures</li>
        <li>Consider the requests made by citizens</li>
        <li>Take appropriate action or provide a response</li>
        <li>Reply to the petition creator if needed</li>
      </ul>
    </div>

    <div class="footer">
      <p>This is an automated message from the Change Liberia civic engagement platform.</p>
      <p>Do not reply to this email. Please log into your dashboard to respond to petitions.</p>
      <p>For technical issues, contact support@liberianvoices.org</p>
    </div>
  </div>
</body>
</html>
    `;

    // Text content
    const text = `
NEW PETITION SUBMISSION

A new petition has been submitted and routed to your institution for action.

PETITION DETAILS
================
Title: ${petition.title}
Petition ID: ${petition.id}
Status: ${petition.status}
Signatures: ${signatureCount}
Category: ${petition.category || 'Not specified'}
Created By: ${creatorName} (${creatorEmail})
Submitted: ${new Date(petition.createdAt).toLocaleDateString()}

DESCRIPTION
===========
${petition.description || 'No description provided'}

ROUTING INFORMATION
===================
Institution: ${institution.name}
Contact Email: ${routingResult.recipientEmails?.[0] || 'N/A'}
Routing Decision: ${routingResult.decision}
${routingResult.notes ? `Notes: ${routingResult.notes}` : ''}

NEXT STEPS
==========
1. Review the petition and signatures
2. Consider the requests made by citizens
3. Take appropriate action or provide a response
4. Reply to the petition creator if needed

---
This is an automated message from the Change Liberia civic engagement platform.
Do not reply to this email. Please log into your dashboard to respond to petitions.
For technical issues, contact support@liberianvoices.org
    `;

    return { html, text };
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Get email delivery status for a petition
   */
  async getDeliveryStatus(petitionId: string): Promise<{
    emailSentAt: Date | null;
    emailDeliveredAt: Date | null;
    emailFailureReason: string | null;
  }> {
    const routingLog = await this.prisma.routingLog.findFirst({
      where: { petitionId },
      select: {
        emailSentAt: true,
        emailDeliveredAt: true,
        emailFailureReason: true,
      },
    });

    return (
      routingLog || {
        emailSentAt: null,
        emailDeliveredAt: null,
        emailFailureReason: null,
      }
    );
  }

  /**
   * Mark email as delivered
   */
  async markEmailDelivered(
    petitionId: string,
    deliveredAt: Date,
  ): Promise<void> {
    await this.prisma.routingLog.updateMany({
      where: { petitionId },
      data: { emailDeliveredAt: deliveredAt },
    });
  }

  /**
   * Mark email as failed
   */
  async markEmailFailed(
    petitionId: string,
    failureReason: string,
  ): Promise<void> {
    await this.prisma.routingLog.updateMany({
      where: { petitionId },
      data: { emailFailureReason: failureReason },
    });
  }
}
