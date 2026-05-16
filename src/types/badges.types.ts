/**
 * GO WITH SALLY - BADGES TYPES
 */

export type BadgeLevel = 'none' | 'basic' | 'verified' | 'premium' | 'elite';

export type DocumentType =
  | 'nationalId'
  | 'nationalIdBack'
  | 'drivingLicense'
  | 'drivingLicenseBack'
  | 'vehicleRegistration'
  | 'insurance'
  | 'vehiclePhotoFront'
  | 'vehiclePhotoBack'
  | 'profilePhoto'
  | 'criminalRecord';

export type DocumentStatus = 
  | 'not_submitted'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired';

export interface LocalizedString {
  fr: string;
  ar: string;
  en: string;
}

export interface BadgeConfig {
  level: BadgeLevel;
  name: LocalizedString;
  icon: string;
  color: string;
  backgroundColor: string;
  minDocs: number;
  benefits: LocalizedString[];
  description: LocalizedString;
}

export interface DocumentInfo {
  type: DocumentType;
  status: DocumentStatus;
  url?: string;
  thumbnailUrl?: string;
  submittedAt?: Date;
  verifiedAt?: Date;
  expiresAt?: Date;
  rejectionReason?: string;
}

export interface BadgeProgress {
  currentLevel: BadgeLevel;
  nextLevel: BadgeLevel | null;
  documentsVerified: number;
  documentsRequired: number;
  progress: number;
  missingDocuments: DocumentType[];
}

export interface DriverBadge {
  level: BadgeLevel;
  earnedAt: Date;
  documents: DocumentInfo[];
  isComplete: boolean;
  progress: BadgeProgress;
}

export interface DocumentRequirement {
  type: DocumentType;
  required: boolean;
  forBadge: BadgeLevel;
  label: LocalizedString;
  description?: LocalizedString;
  acceptedFormats: string[];
  maxSizeMB: number;
}