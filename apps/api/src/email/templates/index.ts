/**
 * Email Templates Index
 * Type definitions for email templates
 * Note: React Email .tsx templates are for documentation/reference only
 * Actual rendering uses Handlebars templates or dynamic generation
 */

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
  | DonationReceivedProps;

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
