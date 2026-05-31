import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailService } from './email.service';
import { EmailType } from '@prisma/client';

/**
 * Email event integration layer
 * Connects email service to application events
 */

@Injectable()
export class EmailEventService {
  private readonly logger = new Logger(EmailEventService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.registerEventListeners();
  }

  /**
   * Register email event listeners
   */
  private registerEventListeners(): void {
    // User events
    this.eventEmitter.on('user.created', (event) =>
      this.onUserCreated(event),
    );
    this.eventEmitter.on('user.email.verification-requested', (event) =>
      this.onEmailVerificationRequested(event),
    );
    this.eventEmitter.on('user.password-reset-requested', (event) =>
      this.onPasswordResetRequested(event),
    );
    this.eventEmitter.on('user.password-changed', (event) =>
      this.onPasswordChanged(event),
    );

    // Petition events
    this.eventEmitter.on('petition.created', (event) =>
      this.onPetitionCreated(event),
    );
    this.eventEmitter.on('petition.approved', (event) =>
      this.onPetitionApproved(event),
    );
    this.eventEmitter.on('petition.milestone', (event) =>
      this.onPetitionMilestone(event),
    );
    this.eventEmitter.on('petition.government-submitted', (event) =>
      this.onPetitionGovernmentSubmitted(event),
    );
    this.eventEmitter.on('petition.government-response', (event) =>
      this.onPetitionGovernmentResponse(event),
    );

    // Poll events
    this.eventEmitter.on('poll.approved', (event) =>
      this.onPollApproved(event),
    );
    this.eventEmitter.on('poll.rejected', (event) =>
      this.onPollRejected(event),
    );

    // Signature/engagement events
    this.eventEmitter.on('signature.received', (event) =>
      this.onSignatureReceived(event),
    );
    this.eventEmitter.on('comment.received', (event) =>
      this.onCommentReceived(event),
    );
    this.eventEmitter.on('comment.replied', (event) =>
      this.onCommentReplied(event),
    );

    // Community events
    this.eventEmitter.on('ambassador.joined', (event) =>
      this.onAmbassadorJoined(event),
    );
    this.eventEmitter.on('community.update', (event) =>
      this.onCommunityUpdate(event),
    );

    // Donation events
    this.eventEmitter.on('donation.received', (event) =>
      this.onDonationReceived(event),
    );

    this.logger.log('Email event listeners registered');
  }

  // User event handlers

  private async onUserCreated(event: any): Promise<void> {
    try {
      const { userId, email, fullName } = event;
      await this.emailService.sendTransactional(
        email,
        userId,
        EmailType.WELCOME,
        {
          recipientName: fullName,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
      );
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error}`);
    }
  }

  private async onEmailVerificationRequested(event: any): Promise<void> {
    try {
      const { userId, email, verifyUrl, fullName } = event;
      await this.emailService.sendTransactional(
        email,
        userId,
        EmailType.VERIFY_EMAIL,
        {
          recipientName: fullName,
          verifyUrl,
          expiresIn: '24 hours',
        },
      );
      this.logger.log(`Email verification sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error}`);
    }
  }

  private async onPasswordResetRequested(event: any): Promise<void> {
    try {
      const { userId, email, resetUrl, fullName } = event;
      await this.emailService.sendTransactional(
        email,
        userId,
        EmailType.PASSWORD_RESET,
        {
          recipientName: fullName,
          resetUrl,
          expiresIn: '1 hour',
        },
      );
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error}`);
    }
  }

  private async onPasswordChanged(event: any): Promise<void> {
    try {
      const { userId, email, fullName } = event;
      await this.emailService.sendTransactional(
        email,
        userId,
        EmailType.PASSWORD_RESET_CONFIRMATION,
        {
          recipientName: fullName,
          changedAt: new Date().toLocaleString(),
        },
      );
      this.logger.log(`Password change confirmation sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password confirmation email: ${error}`);
    }
  }

  // Petition event handlers

  private async onPetitionCreated(event: any): Promise<void> {
    try {
      // Could send confirmation to creator that petition was created
      this.logger.debug(`Petition created: ${event.petitionId}`);
    } catch (error) {
      this.logger.error(`Error handling petition.created event: ${error}`);
    }
  }

  private async onPetitionApproved(event: any): Promise<void> {
    try {
      const { creatorId, creatorEmail, petitionTitle, petitionUrl, creatorName } = event;
      await this.emailService.sendNotification(
        creatorId,
        creatorEmail,
        EmailType.PETITION_APPROVED,
        {
          creatorName,
          petitionTitle,
          petitionUrl,
        },
      );
      this.logger.log(`Petition approved email sent to ${creatorEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send petition approved email: ${error}`);
    }
  }

  private async onPetitionMilestone(event: any): Promise<void> {
    try {
      const {
        creatorId,
        creatorEmail,
        creatorName,
        petitionTitle,
        petitionUrl,
        milestone,
        currentSignatures,
      } = event;

      await this.emailService.sendNotification(
        creatorId,
        creatorEmail,
        EmailType.PETITION_MILESTONE_REACHED,
        {
          creatorName,
          petitionTitle,
          petitionUrl,
          milestoneValue: milestone,
          currentSignatures,
        },
      );
      this.logger.log(`Milestone email sent to ${creatorEmail} for ${milestone} signatures`);
    } catch (error) {
      this.logger.error(`Failed to send milestone email: ${error}`);
    }
  }

  private async onPetitionGovernmentSubmitted(event: any): Promise<void> {
    try {
      const {
        creatorId,
        creatorEmail,
        creatorName,
        petitionTitle,
        petitionUrl,
        signatureCount,
        category,
      } = event;

      await this.emailService.sendNotification(
        creatorId,
        creatorEmail,
        EmailType.GOVERNMENT_SUBMISSION,
        {
          creatorName,
          petitionTitle,
          signatureCount,
          petitionUrl,
          category,
        },
      );
      this.logger.log(`Government submission email sent to ${creatorEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send government submission email: ${error}`);
    }
  }

  private async onPetitionGovernmentResponse(event: any): Promise<void> {
    try {
      const {
        creatorId,
        creatorEmail,
        creatorName,
        petitionTitle,
        responseTitle,
        responseExcerpt,
        responseUrl,
        ministry,
      } = event;

      await this.emailService.sendNotification(
        creatorId,
        creatorEmail,
        EmailType.OFFICIAL_RESPONSE,
        {
          recipientName: creatorName,
          petitionTitle,
          responseTitle,
          responseExcerpt,
          responseUrl,
          ministry,
        },
      );
      this.logger.log(`Government response email sent to ${creatorEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send government response email: ${error}`);
    }
  }

  // Engagement event handlers

  private async onSignatureReceived(event: any): Promise<void> {
    try {
      const { creatorId, creatorEmail, creatorName, signerName, petitionTitle, petitionUrl } =
        event;

      await this.emailService.sendNotification(
        creatorId,
        creatorEmail,
        EmailType.SIGNATURE_RECEIVED,
        {
          recipientName: creatorName,
          signerName,
          petitionTitle,
          petitionUrl,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send signature received email: ${error}`);
    }
  }

  private async onCommentReceived(event: any): Promise<void> {
    try {
      // This event might trigger digest emails instead of individual notifications
      this.logger.debug(`Comment received on petition: ${event.petitionId}`);
    } catch (error) {
      this.logger.error(`Error handling comment.received event: ${error}`);
    }
  }

  private async onCommentReplied(event: any): Promise<void> {
    try {
      const { commenterId, commenterEmail, commenterName, petitionTitle, petitionUrl } = event;

      await this.emailService.sendNotification(
        commenterId,
        commenterEmail,
        EmailType.COMMENT_REPLY,
        {
          recipientName: commenterName,
          petitionTitle,
          petitionUrl,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send comment reply email: ${error}`);
    }
  }

  // Community event handlers

  private async onAmbassadorJoined(event: any): Promise<void> {
    try {
      const { userId, email, fullName } = event;
      await this.emailService.sendNotification(userId, email, EmailType.WELCOME_TO_MOVEMENT, {
        recipientName: fullName,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      });
      this.logger.log(`Ambassador welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send ambassador welcome email: ${error}`);
    }
  }

  private async onCommunityUpdate(event: any): Promise<void> {
    try {
      const { updateTitle, updateContent } = event;
      this.logger.debug(`Community update event: ${updateTitle}`);
      // Could trigger bulk email sending to ambassadors
    } catch (error) {
      this.logger.error(`Error handling community.update event: ${error}`);
    }
  }

  // Poll event handlers

  private async onPollApproved(event: any): Promise<void> {
    try {
      const { creatorId, creatorEmail, creatorName, pollTitle, pollUrl } = event;
      await this.emailService.sendNotification(
        creatorId,
        creatorEmail,
        EmailType.POLL_APPROVED,
        {
          creatorName,
          pollTitle,
          pollUrl,
        },
      );
      this.logger.log(`Poll approved email sent to ${creatorEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send poll approved email: ${error}`);
    }
  }

  private async onPollRejected(event: any): Promise<void> {
    try {
      const { creatorId, creatorEmail, creatorName, pollTitle, reason } = event;
      await this.emailService.sendNotification(
        creatorId,
        creatorEmail,
        EmailType.POLL_REJECTED,
        {
          creatorName,
          pollTitle,
          reason,
        },
      );
      this.logger.log(`Poll rejected email sent to ${creatorEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send poll rejected email: ${error}`);
    }
  }

  // Donation event handler

  private async onDonationReceived(event: any): Promise<void> {
    try {
      const { donorId, donorEmail, donorName, petitionTitle, amount } = event;
      await this.emailService.sendNotification(donorId, donorEmail, EmailType.DONATION_RECEIVED, {
        recipientName: donorName,
        petitionTitle,
        amount,
        receiptUrl: `${process.env.NEXT_PUBLIC_APP_URL}/donations/${donorId}`,
      });
      this.logger.log(`Donation receipt email sent to ${donorEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send donation receipt email: ${error}`);
    }
  }

  /**
   * Emit email event (for internal use)
   */
  emitEmailEvent(eventName: string, data: any): void {
    this.eventEmitter.emit(eventName, data);
  }
}
