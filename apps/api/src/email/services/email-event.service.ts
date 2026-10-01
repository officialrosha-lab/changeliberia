import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailService } from './email.service';
import { EmailType } from '@prisma/client';

/**
 * Email event integration layer
 * Connects email service to application events
 */

interface UserCreatedEvent {
  userId: string;
  email: string;
  fullName: string;
}

interface EmailVerificationRequestedEvent {
  userId: string;
  email: string;
  verificationCode: string;
  fullName: string;
}

interface PasswordResetRequestedEvent {
  userId: string;
  email: string;
  resetUrl: string;
  fullName: string;
}

interface PasswordChangedEvent {
  userId: string;
  email: string;
  fullName: string;
}

interface PetitionCreatedEvent {
  petitionId: string;
}

interface PetitionApprovedEvent {
  creatorId: string;
  creatorEmail: string;
  petitionTitle: string;
  petitionUrl: string;
  creatorName: string;
}

interface PetitionRejectedEvent {
  creatorId: string;
  creatorEmail: string;
  creatorName: string;
  petitionTitle: string;
  reason?: string;
}

interface OfficialVerifiedEvent {
  userId: string;
  userEmail?: string;
  institutionName: string;
}

interface OfficialRejectedEvent {
  userId: string;
  userEmail?: string;
  institutionName: string;
  reason?: string;
}

interface PetitionMilestoneEvent {
  creatorId: string;
  creatorEmail: string;
  creatorName: string;
  petitionTitle: string;
  petitionUrl: string;
  milestone: number;
  currentSignatures: number;
}

interface PetitionGovernmentSubmittedEvent {
  creatorId: string;
  creatorEmail: string;
  creatorName: string;
  petitionTitle: string;
  petitionUrl: string;
  signatureCount: number;
  category: string;
}

interface PetitionGovernmentResponseEvent {
  creatorId: string;
  creatorEmail: string;
  creatorName: string;
  petitionTitle: string;
  responseTitle: string;
  responseExcerpt: string;
  responseUrl: string;
  ministry: string;
}

interface SignatureReceivedEvent {
  creatorId: string;
  creatorEmail: string;
  creatorName: string;
  signerName: string;
  petitionTitle: string;
  petitionUrl: string;
}

interface CommentReceivedEvent {
  petitionId: string;
}

interface CommentRepliedEvent {
  commenterId: string;
  commenterEmail: string;
  commenterName: string;
  petitionTitle: string;
  petitionUrl: string;
}

interface AmbassadorJoinedEvent {
  userId: string;
  email: string;
  fullName: string;
}

interface CommunityUpdateEvent {
  updateTitle: string;
}

interface PollApprovedEvent {
  creatorId: string;
  creatorEmail: string;
  creatorName: string;
  pollTitle: string;
  pollUrl: string;
}

interface PollRejectedEvent {
  creatorId: string;
  creatorEmail: string;
  creatorName: string;
  pollTitle: string;
  reason?: string;
}

interface MessageCreatedEvent {
  recipientId: string;
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  subject: string;
  content?: string;
}

interface BroadcastSentEvent {
  senderId: string;
  senderEmail?: string;
  senderName: string;
  groupType: string;
  recipientCount: number;
  successCount: number;
  failedCount: number;
}

interface DonationReceivedEvent {
  donorId: string;
  donorEmail: string;
  donorName: string;
  petitionTitle: string;
  amount: number;
}

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
    this.eventEmitter.on(
      'user.created',
      (event: UserCreatedEvent) => void this.onUserCreated(event),
    );
    this.eventEmitter.on(
      'user.email.verification-requested',
      (event: EmailVerificationRequestedEvent) =>
        void this.onEmailVerificationRequested(event),
    );
    this.eventEmitter.on(
      'user.password-reset-requested',
      (event: PasswordResetRequestedEvent) =>
        void this.onPasswordResetRequested(event),
    );
    this.eventEmitter.on(
      'user.password-changed',
      (event: PasswordChangedEvent) => void this.onPasswordChanged(event),
    );

    // Petition events
    this.eventEmitter.on(
      'petition.created',
      (event: PetitionCreatedEvent) => void this.onPetitionCreated(event),
    );
    this.eventEmitter.on(
      'petition.approved',
      (event: PetitionApprovedEvent) => void this.onPetitionApproved(event),
    );
    this.eventEmitter.on(
      'petition.rejected',
      (event: PetitionRejectedEvent) => void this.onPetitionRejected(event),
    );
    this.eventEmitter.on(
      'petition.milestone',
      (event: PetitionMilestoneEvent) => void this.onPetitionMilestone(event),
    );
    this.eventEmitter.on(
      'petition.government-submitted',
      (event: PetitionGovernmentSubmittedEvent) =>
        void this.onPetitionGovernmentSubmitted(event),
    );
    this.eventEmitter.on(
      'petition.government-response',
      (event: PetitionGovernmentResponseEvent) =>
        void this.onPetitionGovernmentResponse(event),
    );

    // Public Officials Portal events
    this.eventEmitter.on(
      'official.verified',
      (event: OfficialVerifiedEvent) => void this.onOfficialVerified(event),
    );
    this.eventEmitter.on(
      'official.rejected',
      (event: OfficialRejectedEvent) => void this.onOfficialRejected(event),
    );

    // Poll events
    this.eventEmitter.on(
      'poll.approved',
      (event: PollApprovedEvent) => void this.onPollApproved(event),
    );
    this.eventEmitter.on(
      'poll.rejected',
      (event: PollRejectedEvent) => void this.onPollRejected(event),
    );

    // Message and broadcast events
    this.eventEmitter.on(
      'message.created',
      (event: MessageCreatedEvent) => void this.onMessageCreated(event),
    );
    this.eventEmitter.on(
      'broadcast.sent',
      (event: BroadcastSentEvent) => void this.onBroadcastSent(event),
    );

    // Signature/engagement events
    this.eventEmitter.on(
      'signature.received',
      (event: SignatureReceivedEvent) => void this.onSignatureReceived(event),
    );
    this.eventEmitter.on(
      'comment.received',
      (event: CommentReceivedEvent) => void this.onCommentReceived(event),
    );
    this.eventEmitter.on(
      'comment.replied',
      (event: CommentRepliedEvent) => void this.onCommentReplied(event),
    );

    // Community events
    this.eventEmitter.on(
      'ambassador.joined',
      (event: AmbassadorJoinedEvent) => void this.onAmbassadorJoined(event),
    );
    this.eventEmitter.on(
      'community.update',
      (event: CommunityUpdateEvent) => void this.onCommunityUpdate(event),
    );

    // Donation events
    this.eventEmitter.on(
      'donation.received',
      (event: DonationReceivedEvent) => void this.onDonationReceived(event),
    );

    this.logger.log('Email event listeners registered');
  }

  // User event handlers

  private async onUserCreated(event: UserCreatedEvent): Promise<void> {
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
      this.logger.error(
        `Failed to send welcome email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onEmailVerificationRequested(
    event: EmailVerificationRequestedEvent,
  ): Promise<void> {
    try {
      const { userId, email, verificationCode, fullName } = event;
      await this.emailService.sendTransactional(
        email,
        userId,
        EmailType.VERIFY_EMAIL,
        {
          recipientName: fullName,
          verificationCode,
          expiresIn: '15 minutes',
        },
      );
      this.logger.log(`Email verification sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onPasswordResetRequested(
    event: PasswordResetRequestedEvent,
  ): Promise<void> {
    try {
      const { userId, email, resetUrl, fullName } = event;
      await this.emailService.sendTransactional(
        email,
        userId,
        EmailType.PASSWORD_RESET,
        {
          recipientName: fullName,
          resetUrl,
          expiresIn: 60, // minutes — matches the token's actual 1-hour expiry in password-reset.service.ts
        },
      );
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onPasswordChanged(event: PasswordChangedEvent): Promise<void> {
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
      this.logger.error(
        `Failed to send password confirmation email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Petition event handlers

  private onPetitionCreated(event: PetitionCreatedEvent): void {
    try {
      // Could send confirmation to creator that petition was created
      this.logger.debug(`Petition created: ${event.petitionId}`);
    } catch (error) {
      this.logger.error(
        `Error handling petition.created event: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onPetitionApproved(
    event: PetitionApprovedEvent,
  ): Promise<void> {
    try {
      const {
        creatorId,
        creatorEmail,
        petitionTitle,
        petitionUrl,
        creatorName,
      } = event;
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
      this.logger.error(
        `Failed to send petition approved email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onPetitionRejected(
    event: PetitionRejectedEvent,
  ): Promise<void> {
    try {
      const { creatorId, creatorEmail, creatorName, petitionTitle, reason } =
        event;
      await this.emailService.sendNotification(
        creatorId,
        creatorEmail,
        EmailType.PETITION_REJECTED,
        {
          creatorName,
          petitionTitle,
          reason,
        },
      );
      this.logger.log(`Petition rejected email sent to ${creatorEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send petition rejected email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onOfficialVerified(
    event: OfficialVerifiedEvent,
  ): Promise<void> {
    try {
      const { userId, userEmail, institutionName } = event;
      if (!userEmail) return;
      await this.emailService.sendNotification(
        userId,
        userEmail,
        EmailType.OFFICIAL_VERIFIED,
        { institutionName },
      );
      this.logger.log(`Official verified email sent to ${userEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send official verified email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onOfficialRejected(
    event: OfficialRejectedEvent,
  ): Promise<void> {
    try {
      const { userId, userEmail, institutionName, reason } = event;
      if (!userEmail) return;
      await this.emailService.sendNotification(
        userId,
        userEmail,
        EmailType.OFFICIAL_REJECTED,
        { institutionName, reason },
      );
      this.logger.log(`Official rejected email sent to ${userEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send official rejected email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onPetitionMilestone(
    event: PetitionMilestoneEvent,
  ): Promise<void> {
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
      this.logger.log(
        `Milestone email sent to ${creatorEmail} for ${milestone} signatures`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send milestone email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onPetitionGovernmentSubmitted(
    event: PetitionGovernmentSubmittedEvent,
  ): Promise<void> {
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
      this.logger.error(
        `Failed to send government submission email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onPetitionGovernmentResponse(
    event: PetitionGovernmentResponseEvent,
  ): Promise<void> {
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
      this.logger.error(
        `Failed to send government response email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Engagement event handlers

  private async onSignatureReceived(
    event: SignatureReceivedEvent,
  ): Promise<void> {
    try {
      const {
        creatorId,
        creatorEmail,
        creatorName,
        signerName,
        petitionTitle,
        petitionUrl,
      } = event;

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
      this.logger.error(
        `Failed to send signature received email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private onCommentReceived(event: CommentReceivedEvent): void {
    try {
      // This event might trigger digest emails instead of individual notifications
      this.logger.debug(`Comment received on petition: ${event.petitionId}`);
    } catch (error) {
      this.logger.error(
        `Error handling comment.received event: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onCommentReplied(event: CommentRepliedEvent): Promise<void> {
    try {
      const {
        commenterId,
        commenterEmail,
        commenterName,
        petitionTitle,
        petitionUrl,
      } = event;

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
      this.logger.error(
        `Failed to send comment reply email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Community event handlers

  private async onAmbassadorJoined(
    event: AmbassadorJoinedEvent,
  ): Promise<void> {
    try {
      const { userId, email, fullName } = event;
      await this.emailService.sendNotification(
        userId,
        email,
        EmailType.WELCOME_TO_MOVEMENT,
        {
          recipientName: fullName,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
      );
      this.logger.log(`Ambassador welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send ambassador welcome email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private onCommunityUpdate(event: CommunityUpdateEvent): void {
    try {
      const { updateTitle } = event;
      this.logger.debug(`Community update event: ${updateTitle}`);
      // Could trigger bulk email sending to ambassadors
    } catch (error) {
      this.logger.error(
        `Error handling community.update event: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Poll event handlers

  private async onPollApproved(event: PollApprovedEvent): Promise<void> {
    try {
      const { creatorId, creatorEmail, creatorName, pollTitle, pollUrl } =
        event;
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
      this.logger.error(
        `Failed to send poll approved email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onPollRejected(event: PollRejectedEvent): Promise<void> {
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
      this.logger.error(
        `Failed to send poll rejected email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onMessageCreated(event: MessageCreatedEvent): Promise<void> {
    try {
      const { recipientId, recipientEmail, senderName, subject, content } =
        event;
      const messagePreview = content?.slice(0, 180) || '';
      await this.emailService.sendNotification(
        recipientId,
        recipientEmail,
        EmailType.MESSAGE_NOTIFICATION,
        {
          recipientName: event.recipientName || 'Community Member',
          senderName,
          subject,
          messagePreview,
          messageUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/messages`,
        },
      );
      this.logger.log(`Message notification email sent to ${recipientEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send message notification email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async onBroadcastSent(event: BroadcastSentEvent): Promise<void> {
    try {
      const {
        senderId,
        senderEmail,
        senderName,
        groupType,
        recipientCount,
        successCount,
        failedCount,
      } = event;
      if (!senderEmail) {
        this.logger.warn(
          'Broadcast sent event missing senderEmail, skipping summary email',
        );
        return;
      }
      await this.emailService.sendNotification(
        senderId,
        senderEmail,
        EmailType.BROADCAST_NOTIFICATION,
        {
          recipientName: event.senderName || 'Team Member',
          senderName,
          groupType,
          recipientCount,
          successCount,
          failedCount,
          broadcastUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/broadcasts`,
        },
      );
      this.logger.log(`Broadcast summary email sent to ${senderEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send broadcast summary email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Donation event handler

  private async onDonationReceived(
    event: DonationReceivedEvent,
  ): Promise<void> {
    try {
      const { donorId, donorEmail, donorName, petitionTitle, amount } = event;
      await this.emailService.sendNotification(
        donorId,
        donorEmail,
        EmailType.DONATION_RECEIVED,
        {
          recipientName: donorName,
          petitionTitle,
          amount,
          receiptUrl: `${process.env.NEXT_PUBLIC_APP_URL}/donations/${donorId}`,
        },
      );
      this.logger.log(`Donation receipt email sent to ${donorEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send donation receipt email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Emit email event (for internal use)
   */
  emitEmailEvent(eventName: string, data: any): void {
    this.eventEmitter.emit(eventName, data);
  }
}
