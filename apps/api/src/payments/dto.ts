import {
  IsEmail,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// What a client is allowed to send when creating a payment, checkout
// session, or subscription. Deliberately has no `userId` field — the
// controller always sets that from the authenticated session
// (req.user.userId), never from client input, so a caller can't attribute
// a donation/subscription to another user by passing one in the body.
export class CreatePaymentRequestDto {
  @IsOptional() @IsString() petitionId?: string;
  @IsNumber() @Min(0.01) amount!: number;
  @IsString() @MaxLength(10) currency!: string;
  @IsOptional() @IsString() @MaxLength(200) donorName?: string;
  @IsEmail() donorEmail!: string;
  @IsOptional() @IsIn(['CARD', 'MOBILE_MONEY']) paymentMethod?:
    | 'CARD'
    | 'MOBILE_MONEY';
  @IsOptional() @IsString() @MaxLength(32) phoneNumber?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional() @IsIn(['monthly', 'quarterly', 'yearly']) recurringInterval?:
    | 'monthly'
    | 'quarterly'
    | 'yearly';
}
