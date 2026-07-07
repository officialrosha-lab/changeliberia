import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { InstitutionCategory, GovernmentResponseStage, OfficialStaffRole } from '@prisma/client';

const INDIVIDUAL_OFFICE_CATEGORIES = [
  InstitutionCategory.SENATOR,
  InstitutionCategory.REPRESENTATIVE,
  InstitutionCategory.MAYOR,
  InstitutionCategory.SUPERINTENDENT,
  InstitutionCategory.COMMISSIONER,
  InstitutionCategory.DISTRICT_COMMISSIONER,
  InstitutionCategory.EXECUTIVE_OFFICE,
];

export { INDIVIDUAL_OFFICE_CATEGORIES };

export class CreateOfficialApplicationDto {
  @IsString() @MaxLength(200) name!: string; // office/institution display name, e.g. "Senator, Montserrado County"
  @IsIn(INDIVIDUAL_OFFICE_CATEGORIES) category!: InstitutionCategory;
  @IsEmail() officialEmail!: string;
  @IsOptional() @IsString() county?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() politicalParty?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() @MaxLength(4000) bio?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() verificationDocUrl?: string;
  @IsOptional() @IsString() verificationDocType?: string;
}

export class UpdateOfficialProfileDto {
  @IsOptional() @IsString() @MaxLength(4000) bio?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() @MaxLength(2000) officeHours?: string; // JSON string
  @IsOptional() @IsString() officeAddress?: string;
  @IsOptional() @IsString() @MaxLength(2000) socialLinks?: string; // JSON string
}

export class AdvanceResponseStageDto {
  @IsEnum(GovernmentResponseStage) stage!: GovernmentResponseStage;
  @IsOptional() @IsString() @MaxLength(4000) note?: string;
}

export class RejectOfficialDto {
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class InviteStaffDto {
  @IsString() phone!: string; // must be an existing platform user
  @IsEnum(OfficialStaffRole) role!: OfficialStaffRole;
  @IsOptional() @IsBoolean() canDraft?: boolean;
  @IsOptional() @IsBoolean() canRespond?: boolean;
  @IsOptional() @IsBoolean() canManageInbox?: boolean;
  @IsOptional() @IsBoolean() canGenerateReports?: boolean;
}

export class UpdateStaffPermissionsDto {
  @IsOptional() @IsEnum(OfficialStaffRole) role?: OfficialStaffRole;
  @IsOptional() @IsBoolean() canView?: boolean;
  @IsOptional() @IsBoolean() canDraft?: boolean;
  @IsOptional() @IsBoolean() canRespond?: boolean;
  @IsOptional() @IsBoolean() canManageInbox?: boolean;
  @IsOptional() @IsBoolean() canGenerateReports?: boolean;
}
