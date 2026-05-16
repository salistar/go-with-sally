/**
 * GO WITH SALLY - BADGES CONSTANTS
 * Système de badges pour les conductrices
 */

import { BadgeLevel, BadgeConfig, DocumentType } from '../types/badges.types';

export const BADGE_CONFIGS: Record<BadgeLevel, BadgeConfig> = {
  none: {
    level: 'none',
    name: { fr: 'Non vérifié', ar: 'غير موثق', en: 'Not Verified' },
    icon: '⚪',
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    minDocs: 0,
    benefits: [],
    description: {
      fr: 'Aucun document vérifié',
      ar: 'لا توجد وثائق موثقة',
      en: 'No documents verified',
    },
  },
  basic: {
    level: 'basic',
    name: { fr: 'Basique', ar: 'أساسي', en: 'Basic' },
    icon: '🔵',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    minDocs: 2,
    benefits: [
      { fr: 'Peut accepter des courses', ar: 'يمكنها قبول الرحلات', en: 'Can accept rides' },
    ],
    description: {
      fr: 'CIN et permis vérifiés',
      ar: 'بطاقة الهوية ورخصة القيادة موثقة',
      en: 'ID and license verified',
    },
  },
  verified: {
    level: 'verified',
    name: { fr: 'Vérifiée', ar: 'موثقة', en: 'Verified' },
    icon: '✅',
    color: '#22C55E',
    backgroundColor: '#DCFCE7',
    minDocs: 5,
    benefits: [
      { fr: 'Badge visible par les passagères', ar: 'شارة مرئية للراكبات', en: 'Badge visible to passengers' },
      { fr: 'Priorité dans les courses', ar: 'أولوية في الرحلات', en: 'Priority for rides' },
      { fr: '+5% de revenus', ar: '+5% من الأرباح', en: '+5% earnings' },
    ],
    description: {
      fr: '5 documents essentiels vérifiés',
      ar: '5 وثائق أساسية موثقة',
      en: '5 essential documents verified',
    },
  },
  premium: {
    level: 'premium',
    name: { fr: 'Premium', ar: 'مميزة', en: 'Premium' },
    icon: '💜',
    color: '#A855F7',
    backgroundColor: '#F3E8FF',
    minDocs: 7,
    benefits: [
      { fr: 'Tous les avantages Vérifiée', ar: 'جميع مزايا الموثقة', en: 'All Verified benefits' },
      { fr: 'Accès au service Sally Confort', ar: 'الوصول إلى خدمة سالي كومفورت', en: 'Access to Sally Comfort service' },
      { fr: '+10% de revenus', ar: '+10% من الأرباح', en: '+10% earnings' },
    ],
    description: {
      fr: '7 documents vérifiés',
      ar: '7 وثائق موثقة',
      en: '7 documents verified',
    },
  },
  elite: {
    level: 'elite',
    name: { fr: 'Élite', ar: 'نخبة', en: 'Elite' },
    icon: '👑',
    color: '#EAB308',
    backgroundColor: '#FEF9C3',
    minDocs: 9,
    benefits: [
      { fr: 'Tous les avantages Premium', ar: 'جميع مزايا المميزة', en: 'All Premium benefits' },
      { fr: 'Courses prioritaires', ar: 'رحلات ذات أولوية', en: 'Priority rides' },
      { fr: '+15% de revenus', ar: '+15% من الأرباح', en: '+15% earnings' },
      { fr: 'Support dédié', ar: 'دعم مخصص', en: 'Dedicated support' },
    ],
    description: {
      fr: 'Tous les documents vérifiés + casier judiciaire',
      ar: 'جميع الوثائق موثقة + السجل العدلي',
      en: 'All documents verified + criminal record',
    },
  },
};

export const REQUIRED_DOCUMENTS: { type: DocumentType; required: boolean; forBadge: BadgeLevel }[] = [
  { type: 'nationalId', required: true, forBadge: 'basic' },
  { type: 'nationalIdBack', required: true, forBadge: 'basic' },
  { type: 'drivingLicense', required: true, forBadge: 'basic' },
  { type: 'drivingLicenseBack', required: false, forBadge: 'verified' },
  { type: 'vehicleRegistration', required: true, forBadge: 'verified' },
  { type: 'insurance', required: true, forBadge: 'verified' },
  { type: 'vehiclePhotoFront', required: false, forBadge: 'premium' },
  { type: 'vehiclePhotoBack', required: false, forBadge: 'premium' },
  { type: 'profilePhoto', required: true, forBadge: 'verified' },
  { type: 'criminalRecord', required: false, forBadge: 'elite' },
];

export const DOCUMENT_LABELS: Record<DocumentType, { fr: string; ar: string; en: string }> = {
  nationalId: { fr: 'CIN (Recto)', ar: 'بطاقة الهوية (الوجه)', en: 'National ID (Front)' },
  nationalIdBack: { fr: 'CIN (Verso)', ar: 'بطاقة الهوية (الظهر)', en: 'National ID (Back)' },
  drivingLicense: { fr: 'Permis de conduire (Recto)', ar: 'رخصة القيادة (الوجه)', en: 'Driving License (Front)' },
  drivingLicenseBack: { fr: 'Permis de conduire (Verso)', ar: 'رخصة القيادة (الظهر)', en: 'Driving License (Back)' },
  vehicleRegistration: { fr: 'Carte grise', ar: 'البطاقة الرمادية', en: 'Vehicle Registration' },
  insurance: { fr: 'Assurance véhicule', ar: 'تأمين السيارة', en: 'Vehicle Insurance' },
  vehiclePhotoFront: { fr: 'Photo véhicule (Avant)', ar: 'صورة السيارة (الأمام)', en: 'Vehicle Photo (Front)' },
  vehiclePhotoBack: { fr: 'Photo véhicule (Arrière)', ar: 'صورة السيارة (الخلف)', en: 'Vehicle Photo (Back)' },
  profilePhoto: { fr: 'Photo de profil', ar: 'صورة الملف الشخصي', en: 'Profile Photo' },
  criminalRecord: { fr: 'Casier judiciaire', ar: 'السجل العدلي', en: 'Criminal Record' },
};

export function calculateBadgeLevel(verifiedDocuments: DocumentType[]): BadgeLevel {
  const count = verifiedDocuments.length;
  
  if (count >= 9) return 'elite';
  if (count >= 7) return 'premium';
  if (count >= 5) return 'verified';
  if (count >= 2) return 'basic';
  return 'none';
}

export function getNextBadgeRequirements(
  currentLevel: BadgeLevel,
  verifiedDocuments: DocumentType[]
): { nextLevel: BadgeLevel; missingDocuments: DocumentType[]; progress: number } | null {
  const levels: BadgeLevel[] = ['none', 'basic', 'verified', 'premium', 'elite'];
  const currentIndex = levels.indexOf(currentLevel);
  
  if (currentIndex >= levels.length - 1) return null;
  
  const nextLevel = levels[currentIndex + 1];
  const nextConfig = BADGE_CONFIGS[nextLevel];
  
  const missingDocuments = REQUIRED_DOCUMENTS
    .filter(doc => {
      const levelIndex = levels.indexOf(doc.forBadge);
      return levelIndex <= levels.indexOf(nextLevel) && !verifiedDocuments.includes(doc.type);
    })
    .map(doc => doc.type);
  
  const progress = (verifiedDocuments.length / nextConfig.minDocs) * 100;
  
  return { nextLevel, missingDocuments, progress: Math.min(progress, 100) };
}

export default {
  BADGE_CONFIGS,
  REQUIRED_DOCUMENTS,
  DOCUMENT_LABELS,
  calculateBadgeLevel,
  getNextBadgeRequirements,
};