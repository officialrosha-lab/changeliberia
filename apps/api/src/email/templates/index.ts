/**
 * Email Templates Index
 * Type definitions for email templates
 * Note: React Email .tsx templates are for documentation/reference only
 * Actual rendering uses Handlebars templates or dynamic generation
 */

import { EmailType } from '@prisma/client';

// Template Component Types
export type EmailTemplateProps =
  | WelcomeEmailProps
  | VerifyEmailProps
  | PasswordResetEmailProps
  | PasswordResetConfirmationProps
  | PetitionApprovedProps
  | PetitionRejectedProps
  | MilestoneReachedProps
  | GovernmentSubmissionProps
  | OfficialResponseProps
  | WelcomeToMovementProps
  | AmbassadorUpdateProps
  | CommentReplyProps
  | SignatureReceivedProps
  | WeeklyDigestProps
  | DonationReceivedProps
  | PollApprovedProps
  | PollRejectedProps;

// Type mapping for email types to their props
export type EmailTemplatePropsMap = {
  [EmailType.WELCOME]: WelcomeEmailProps;
  [EmailType.VERIFY_EMAIL]: VerifyEmailProps;
  [EmailType.PASSWORD_RESET]: PasswordResetEmailProps;
  [EmailType.PASSWORD_RESET_CONFIRMATION]: PasswordResetConfirmationProps;
  [EmailType.PETITION_APPROVED]: PetitionApprovedProps;
  [EmailType.PETITION_REJECTED]: PetitionRejectedProps;
  [EmailType.PETITION_MILESTONE_REACHED]: MilestoneReachedProps;
  [EmailType.GOVERNMENT_SUBMISSION]: GovernmentSubmissionProps;
  [EmailType.OFFICIAL_RESPONSE]: OfficialResponseProps;
  [EmailType.WELCOME_TO_MOVEMENT]: WelcomeToMovementProps;
  [EmailType.AMBASSADOR_UPDATE]: AmbassadorUpdateProps;
  [EmailType.COMMENT_REPLY]: CommentReplyProps;
  [EmailType.SIGNATURE_RECEIVED]: SignatureReceivedProps;
  [EmailType.WEEKLY_DIGEST]: WeeklyDigestProps;
  [EmailType.DONATION_RECEIVED]: DonationReceivedProps;
  [EmailType.POLL_APPROVED]: PollApprovedProps;
  [EmailType.POLL_REJECTED]: PollRejectedProps;
};

// Export individual template prop types for type safety
export interface WelcomeEmailProps {
  recipientName: string;
  appUrl: string;
  verifyUrl: string;
}

export interface VerifyEmailProps {
  recipientName: string;
  verificationCode: string;
  verifyUrl: string;
}

export interface PasswordResetEmailProps {
  recipientName: string;
  resetUrl: string;
  expiresIn: number; // minutes
}

export interface PasswordResetConfirmationProps {
  recipientName: string;
  appUrl: string;
}

export interface PetitionApprovedProps {
  recipientName: string;
  petitionTitle: string;
  petitionUrl: string;
  category?: string;
}

export interface PetitionRejectedProps {
  recipientName: string;
  petitionTitle: string;
  reason?: string;
  appUrl: string;
}

export interface MilestoneReachedProps {
  recipientName: string;
  petitionTitle: string;
  milestone: number;
  petitionUrl: string;
}

export interface GovernmentSubmissionProps {
  recipientName: string;
  petitionTitle: string;
  governmentDepartment: string;
  submissionDate: string;
  trackingUrl: string;
}

export interface OfficialResponseProps {
  recipientName: string;
  petitionTitle: string;
  responseStatus: 'ACKNOWLEDGED' | 'UNDER_REVIEW' | 'RESPONDED';
  responseText: string;
  petitionUrl: string;
}

export interface WelcomeToMovementProps {
  recipientName: string;
  movementName: string;
  movementUrl: string;
  actionItems?: string[];
}

export interface AmbassadorUpdateProps {
  recipientName: string;
  title: string;
  content: string;
  ctaUrl?: string;
  ctaText?: string;
}

export interface CommentReplyProps {
  recipientName: string;
  commentAuthor: string;
  replyText: string;
  petitionTitle: string;
  petitionUrl: string;
}

export interface SignatureReceivedProps {
  recipientName: string;
  signerName: string;
  petitionTitle: string;
  totalSignatures: number;
  petitionUrl: string;
}

export interface WeeklyDigestProps {
  recipientName: string;
  trendingPetitions: Array<{
    title: string;
    url: string;
    newSignatures: number;
  }>;
  diggestUrl: string;
}

export interface DonationReceivedProps {
  recipientName: string;
  donorName?: string;
  amount: number;
  currency: string;
  dedicationMessage?: string;
  receiptUrl: string;
}

export interface PollApprovedProps {
  recipientName: string;
  pollTitle: string;
  pollUrl: string;
  category?: string;
}

export interface PollRejectedProps {
  recipientName: string;
  pollTitle: string;
  reason?: string;
  appUrl: string;
}
