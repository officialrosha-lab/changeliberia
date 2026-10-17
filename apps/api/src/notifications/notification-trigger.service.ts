import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  SignatureAddedEvent,
  PetitionApprovedEvent,
  PetitionRejectedEvent,
  PetitionResubmittedEvent,
} from '../events/domain-events';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * NotificationTriggerService
 * Listens to domain events and creates notifications in response
 * Implements the event-driven notification pattern
 */
@Injectable()
export class NotificationTriggerService {
  constructor(
    private eventEmitter: EventEmitter2,
    private notificationService: NotificationService,
    private prisma: PrismaService,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Subscribe to signature added event
    // When someone signs a petition, notify the petition creator
    this.eventEmitter.on(
      'SIGNATURE_ADDED',
      (event: SignatureAddedEvent) => void this.handleSignatureAdded(event),
    );

    // Subscribe to petition approved event
    // When a petition is approved, notify the creator
    this.eventEmitter.on(
      'PETITION_APPROVED',
      (event: PetitionApprovedEvent) => void this.handlePetitionApproved(event),
    );

    // Subscribe to petition rejected event
    // When a petition is rejected, notify the creator
    this.eventEmitter.on(
      'PETITION_REJECTED',
      (event: PetitionRejectedEvent) => void this.handlePetitionRejected(event),
    );

    // Subscribe to petition resubmitted event
    // When a creator disputes/resubmits a rejected petition, notify the
    // reviewer who rejected it
    this.eventEmitter.on(
      'PETITION_RESUBMITTED',
      (event: PetitionResubmittedEvent) =>
        void this.handlePetitionResubmitted(event),
    );
  }

  /**
   * Handle signature added event
   * Create SIGNATURE_RECEIVED notification for petition creator
   */
  private async handleSignatureAdded(event: SignatureAddedEvent) {
    try {
      // Only create notification if signature is from an authenticated user
      // Anonymous signatures won't trigger notifications
      if (event.userId) {
        const petition = await this.prisma.petition.findUnique({
          where: { id: event.petitionId },
          select: { creatorId: true },
        });

        if (petition?.creatorId) {
          await this.notificationService.create({
            userId: petition.creatorId,
            type: 'SIGNATURE_RECEIVED',
            title: 'New Signature',
            message: `Someone signed your petition`,
            relatedEntityId: event.petitionId,
            relatedEntityType: 'petition',
            metadata: {
              petitionId: event.petitionId,
              signatureId: event.entityId,
              trustScore: event.trustScore,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error creating signature notification:', error);
      // Don't throw - notifications shouldn't block main flow
    }
  }

  /**
   * Handle petition approved event
   * Create PETITION_APPROVED notification for petition creator
   */
  private async handlePetitionApproved(event: PetitionApprovedEvent) {
    try {
      await this.notificationService.create({
        userId: event.creatorId,
        type: 'PETITION_APPROVED',
        title: 'Petition Approved 🎉',
        message: `Your petition "${event.title}" has been approved and is now live!`,
        relatedEntityId: event.entityId,
        relatedEntityType: 'petition',
        metadata: {
          petitionId: event.entityId,
          approvedBy: event.moderatorId,
          approvalTime: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error creating petition approved notification:', error);
    }
  }

  /**
   * Handle petition rejected event
   * Create PETITION_REJECTED notification for petition creator
   */
  private async handlePetitionRejected(event: PetitionRejectedEvent) {
    try {
      await this.notificationService.create({
        userId: event.creatorId,
        type: 'PETITION_REJECTED',
        title: 'Petition Rejected',
        message: `Your petition "${event.title}" was rejected. Reason: ${event.rejectionReason}`,
        relatedEntityId: event.entityId,
        relatedEntityType: 'petition',
        metadata: {
          petitionId: event.entityId,
          rejectionReason: event.rejectionReason,
          rejectedBy: event.moderatorId,
          rejectionTime: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error creating petition rejected notification:', error);
    }
  }

  /**
   * Handle petition resubmitted event
   * Create PETITION_RESUBMITTED notification for the reviewer who rejected it
   */
  private async handlePetitionResubmitted(event: PetitionResubmittedEvent) {
    try {
      if (!event.rejectedBy) return;
      await this.notificationService.create({
        userId: event.rejectedBy,
        type: 'PETITION_RESUBMITTED',
        title: 'Petition Resubmitted',
        message: `"${event.title}" was resubmitted for review (revision ${event.revisionCount}).${
          event.disputeMessage ? ` Creator's note: ${event.disputeMessage}` : ''
        }`,
        relatedEntityId: event.entityId,
        relatedEntityType: 'petition',
        metadata: {
          petitionId: event.entityId,
          disputeMessage: event.disputeMessage,
          revisionCount: event.revisionCount,
          resubmittedBy: event.creatorId,
        },
      });
    } catch (error) {
      console.error('Error creating petition resubmitted notification:', error);
    }
  }
}
