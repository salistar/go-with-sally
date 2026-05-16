/**
 * ============================================================================
 * GO WITH SALLY - COMPREHENSIVE STATIC MOCK DATA
 * ============================================================================
 * Mock data for offline mode and hybrid fallback
 * Includes realistic Moroccan data
 *
 * @module mocks/staticData
 * @version 1.0.0
 * ============================================================================
 */

import { UserRole, RideStatus, PaymentMethod, ServiceType } from '../services/api';
import { BadgeLevel } from '../types/badges.types';

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: UserRole;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  faceVerified: boolean;
  preferredLanguage: string;
  points: number;
  level: string;
  totalRides: number;
  averageRating: number;
  createdAt: string;
  location?: {
    latitude: number;
    longitude: number;
    city: string;
  };
}

export interface Driver extends User {
  vehicleInfo: {
    brand: string;
    model: string;
    color: string;
    plateNumber: string;
    registrationNumber: string;
  };
  currentLocation: {
    latitude: number;
    longitude: number;
    city: string;
  };
  isOnline: boolean;
  acceptanceRate: number;
  cancellationRate: number;
  completionRate: number;
  badgeLevel: BadgeLevel;
  bankAccount?: {
    accountHolder: string;
    iban: string;
  };
}

export interface Ride {
  id: string;
  userId: string;
  driverId?: string;
  status: RideStatus;
  serviceType: ServiceType;
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
  };
  dropoffLocation: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
  };
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedPrice: number;
  actualPrice?: number;
  paymentMethod: PaymentMethod;
  passengers: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  rating?: number;
  review?: string;
  createdAt: string;
}

export interface Service {
  type: ServiceType;
  name: {
    fr: string;
    ar: string;
    en: string;
  };
  description: {
    fr: string;
    ar: string;
    en: string;
  };
  icon: string;
  color: string;
  basePrice: number;
  pricePerKm: number;
  minimumFare: number;
  estimatedWaitTime: {
    min: number;
    max: number;
  };
  capacity: {
    min: number;
    max: number;
  };
}

export interface Badge {
  id: string;
  level: BadgeLevel;
  name: {
    fr: string;
    ar: string;
    en: string;
  };
  icon: string;
  color: string;
  requirements: {
    minDocuments: number;
    minRides: number;
    minRating: number;
  };
  benefits: {
    fr: string;
    ar: string;
    en: string;
  }[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  messageType: 'text' | 'image' | 'location';
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'ride' | 'message' | 'promotion' | 'system' | 'warning';
  title: string;
  message: string;
  actionType?: string;
  actionData?: any;
  isRead: boolean;
  timestamp: string;
}

export interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  totalRevenue: number;
  averageRating: number;
  activeDrivers: number;
  pendingVerifications: number;
  todayRides: number;
  thisMonthRevenue: number;
}

// ============================================================================
// MOROCCAN CITIES & GPS COORDINATES
// ============================================================================

const moroccanCities = {
  casablanca: { lat: 33.5731, lon: -7.5898, name: 'Casablanca' },
  rabat: { lat: 34.0209, lon: -6.8498, name: 'Rabat' },
  marrakech: { lat: 31.6295, lon: -7.9811, name: 'Marrakech' },
  fes: { lat: 34.0331, lon: -5.0078, name: 'Fès' },
  tanger: { lat: 35.7595, lon: -5.8128, name: 'Tanger' },
};

// ============================================================================
// MOROCCAN NAMES & PHONE NUMBERS
// ============================================================================

const moroccanFirstNames = [
  'Ahmed', 'Mohammed', 'Fatima', 'Aisha', 'Hassan', 'Laila', 'Omar', 'Yasmine',
  'Karim', 'Leila', 'Ibrahim', 'Noor', 'Ali', 'Zainab', 'Khalid', 'Samira',
  'Yusuf', 'Nadia', 'Jamal', 'Hana', 'Samir', 'Dina', 'Malik', 'Sofia',
];

const moroccanLastNames = [
  'Benali', 'Bennani', 'Boussa', 'Chaoui', 'El Fassi', 'Ouardi', 'Tazi',
  'Bennani', 'Fassi', 'Idrissi', 'Kabbaj', 'Lazrak', 'Meouche', 'Naamani',
  'Qarrache', 'Semlali', 'Tlemçani', 'Youssef', 'Zaoui', 'Abdelhamid',
];

const moroccanStreets = [
  'Avenue Mohammed V',
  'Rue de la Liberté',
  'Boulevard Zerktouni',
  'Avenue Hassan II',
  'Rue du Prince Moulay Abdallah',
  'Boulevard de la Corniche',
  'Rue Guelifate',
  'Avenue Driss el Harti',
  'Rue Sidi Fateh',
  'Boulevard de l\'Océan Atlantique',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generatePhone(): string {
  const codes = ['06', '07'];
  const code = codes[Math.floor(Math.random() * codes.length)];
  const number = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, '0');
  return `+212${code}${number}`;
}

function getRandomName(): { firstName: string; lastName: string } {
  return {
    firstName: moroccanFirstNames[Math.floor(Math.random() * moroccanFirstNames.length)],
    lastName: moroccanLastNames[Math.floor(Math.random() * moroccanLastNames.length)],
  };
}

function getRandomStreet(): string {
  return moroccanStreets[Math.floor(Math.random() * moroccanStreets.length)];
}

function getRandomCity(): (typeof moroccanCities)[keyof typeof moroccanCities] {
  const cities = Object.values(moroccanCities);
  return cities[Math.floor(Math.random() * cities.length)];
}

function getRandomAvatar(): string {
  const id = Math.floor(Math.random() * 70) + 1;
  return `https://i.pravatar.cc/150?img=${id}`;
}

// ============================================================================
// MOCK USERS DATA
// ============================================================================

export const MOCK_USERS: User[] = [
  {
    id: 'user_001',
    firstName: 'Ahmed',
    lastName: 'Benali',
    email: 'ahmed.benali@example.com',
    phone: '+212612345678',
    avatar: getRandomAvatar(),
    role: 'user',
    isVerified: true,
    emailVerified: true,
    phoneVerified: true,
    faceVerified: true,
    preferredLanguage: 'fr',
    points: 2500,
    level: 'Gold',
    totalRides: 145,
    averageRating: 4.8,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    location: {
      latitude: moroccanCities.casablanca.lat,
      longitude: moroccanCities.casablanca.lon,
      city: 'Casablanca',
    },
  },
  {
    id: 'user_002',
    firstName: 'Fatima',
    lastName: 'Bennani',
    email: 'fatima.bennani@example.com',
    phone: '+212698765432',
    avatar: getRandomAvatar(),
    role: 'user',
    isVerified: true,
    emailVerified: true,
    phoneVerified: true,
    faceVerified: false,
    preferredLanguage: 'ar',
    points: 1200,
    level: 'Silver',
    totalRides: 67,
    averageRating: 4.6,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    location: {
      latitude: moroccanCities.rabat.lat,
      longitude: moroccanCities.rabat.lon,
      city: 'Rabat',
    },
  },
  {
    id: 'user_003',
    firstName: 'Hassan',
    lastName: 'Chaoui',
    email: 'hassan.chaoui@example.com',
    phone: '+212711223344',
    avatar: getRandomAvatar(),
    role: 'user',
    isVerified: false,
    emailVerified: true,
    phoneVerified: true,
    faceVerified: false,
    preferredLanguage: 'en',
    points: 850,
    level: 'Bronze',
    totalRides: 23,
    averageRating: 4.5,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    location: {
      latitude: moroccanCities.marrakech.lat,
      longitude: moroccanCities.marrakech.lon,
      city: 'Marrakech',
    },
  },
];

// ============================================================================
// MOCK DRIVERS DATA
// ============================================================================

export const MOCK_DRIVERS: Driver[] = [
  {
    id: 'driver_001',
    firstName: 'Mohammed',
    lastName: 'El Fassi',
    email: 'mohammed.fassi@example.com',
    phone: '+212644556677',
    avatar: getRandomAvatar(),
    role: 'driver',
    isVerified: true,
    emailVerified: true,
    phoneVerified: true,
    faceVerified: true,
    preferredLanguage: 'fr',
    points: 5600,
    level: 'Platinum',
    totalRides: 892,
    averageRating: 4.9,
    createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
    vehicleInfo: {
      brand: 'Toyota',
      model: 'Prius',
      color: 'Silver',
      plateNumber: 'CC-12345',
      registrationNumber: 'CC12345RG',
    },
    currentLocation: {
      latitude: moroccanCities.casablanca.lat + (Math.random() - 0.5) * 0.1,
      longitude: moroccanCities.casablanca.lon + (Math.random() - 0.5) * 0.1,
      city: 'Casablanca',
    },
    isOnline: true,
    acceptanceRate: 98,
    cancellationRate: 2,
    completionRate: 99,
    badgeLevel: 'elite',
    bankAccount: {
      accountHolder: 'Mohammed El Fassi',
      iban: 'MA64591500001234567890',
    },
  },
  {
    id: 'driver_002',
    firstName: 'Karim',
    lastName: 'Tazi',
    email: 'karim.tazi@example.com',
    phone: '+212677778888',
    avatar: getRandomAvatar(),
    role: 'driver',
    isVerified: true,
    emailVerified: true,
    phoneVerified: true,
    faceVerified: true,
    preferredLanguage: 'ar',
    points: 4200,
    level: 'Gold',
    totalRides: 650,
    averageRating: 4.7,
    createdAt: new Date(Date.now() - 550 * 24 * 60 * 60 * 1000).toISOString(),
    vehicleInfo: {
      brand: 'Dacia',
      model: 'Logan',
      color: 'White',
      plateNumber: 'RB-54321',
      registrationNumber: 'RB54321RG',
    },
    currentLocation: {
      latitude: moroccanCities.rabat.lat + (Math.random() - 0.5) * 0.1,
      longitude: moroccanCities.rabat.lon + (Math.random() - 0.5) * 0.1,
      city: 'Rabat',
    },
    isOnline: true,
    acceptanceRate: 95,
    cancellationRate: 3,
    completionRate: 98,
    badgeLevel: 'premium',
    bankAccount: {
      accountHolder: 'Karim Tazi',
      iban: 'MA64591500002234567890',
    },
  },
  {
    id: 'driver_003',
    firstName: 'Laila',
    lastName: 'Idrissi',
    email: 'laila.idrissi@example.com',
    phone: '+212699990000',
    avatar: getRandomAvatar(),
    role: 'driver',
    isVerified: true,
    emailVerified: true,
    phoneVerified: true,
    faceVerified: false,
    preferredLanguage: 'en',
    points: 3100,
    level: 'Silver',
    totalRides: 425,
    averageRating: 4.5,
    createdAt: new Date(Date.now() - 380 * 24 * 60 * 60 * 1000).toISOString(),
    vehicleInfo: {
      brand: 'Renault',
      model: 'Clio',
      color: 'Red',
      plateNumber: 'MK-11111',
      registrationNumber: 'MK11111RG',
    },
    currentLocation: {
      latitude: moroccanCities.marrakech.lat + (Math.random() - 0.5) * 0.1,
      longitude: moroccanCities.marrakech.lon + (Math.random() - 0.5) * 0.1,
      city: 'Marrakech',
    },
    isOnline: false,
    acceptanceRate: 92,
    cancellationRate: 5,
    completionRate: 96,
    badgeLevel: 'verified',
    bankAccount: {
      accountHolder: 'Laila Idrissi',
      iban: 'MA64591500003234567890',
    },
  },
  {
    id: 'driver_004',
    firstName: 'Omar',
    lastName: 'Lazrak',
    email: 'omar.lazrak@example.com',
    phone: '+212612111111',
    avatar: getRandomAvatar(),
    role: 'driver',
    isVerified: true,
    emailVerified: true,
    phoneVerified: true,
    faceVerified: true,
    preferredLanguage: 'fr',
    points: 2800,
    level: 'Silver',
    totalRides: 312,
    averageRating: 4.6,
    createdAt: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000).toISOString(),
    vehicleInfo: {
      brand: 'Nissan',
      model: 'Altima',
      color: 'Black',
      plateNumber: 'FE-22222',
      registrationNumber: 'FE22222RG',
    },
    currentLocation: {
      latitude: moroccanCities.fes.lat + (Math.random() - 0.5) * 0.1,
      longitude: moroccanCities.fes.lon + (Math.random() - 0.5) * 0.1,
      city: 'Fès',
    },
    isOnline: true,
    acceptanceRate: 94,
    cancellationRate: 4,
    completionRate: 97,
    badgeLevel: 'verified',
    bankAccount: {
      accountHolder: 'Omar Lazrak',
      iban: 'MA64591500004234567890',
    },
  },
  {
    id: 'driver_005',
    firstName: 'Yasmine',
    lastName: 'Semlali',
    email: 'yasmine.semlali@example.com',
    phone: '+212688888888',
    avatar: getRandomAvatar(),
    role: 'driver',
    isVerified: false,
    emailVerified: true,
    phoneVerified: true,
    faceVerified: false,
    preferredLanguage: 'ar',
    points: 1500,
    level: 'Bronze',
    totalRides: 145,
    averageRating: 4.3,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    vehicleInfo: {
      brand: 'Hyundai',
      model: 'i10',
      color: 'Blue',
      plateNumber: 'TN-33333',
      registrationNumber: 'TN33333RG',
    },
    currentLocation: {
      latitude: moroccanCities.tanger.lat + (Math.random() - 0.5) * 0.1,
      longitude: moroccanCities.tanger.lon + (Math.random() - 0.5) * 0.1,
      city: 'Tanger',
    },
    isOnline: true,
    acceptanceRate: 88,
    cancellationRate: 8,
    completionRate: 94,
    badgeLevel: 'basic',
  },
];

// ============================================================================
// MOCK RIDES DATA
// ============================================================================

export const MOCK_RIDES: Ride[] = [
  {
    id: 'ride_001',
    userId: 'user_001',
    driverId: 'driver_001',
    status: 'completed',
    serviceType: 'sally_standard',
    pickupLocation: {
      latitude: moroccanCities.casablanca.lat,
      longitude: moroccanCities.casablanca.lon,
      address: `${getRandomStreet()}, Casablanca`,
      city: 'Casablanca',
    },
    dropoffLocation: {
      latitude: moroccanCities.casablanca.lat + 0.05,
      longitude: moroccanCities.casablanca.lon + 0.05,
      address: `${getRandomStreet()}, Casablanca`,
      city: 'Casablanca',
    },
    estimatedDistance: 8.5,
    estimatedDuration: 22,
    estimatedPrice: 45.0,
    actualPrice: 48.5,
    paymentMethod: 'card',
    passengers: 1,
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    rating: 5,
    review: 'Excellent service, very professional driver',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ride_002',
    userId: 'user_002',
    driverId: 'driver_002',
    status: 'in_progress',
    serviceType: 'sally_eco',
    pickupLocation: {
      latitude: moroccanCities.rabat.lat,
      longitude: moroccanCities.rabat.lon,
      address: `${getRandomStreet()}, Rabat`,
      city: 'Rabat',
    },
    dropoffLocation: {
      latitude: moroccanCities.rabat.lat + 0.08,
      longitude: moroccanCities.rabat.lon + 0.08,
      address: `${getRandomStreet()}, Rabat`,
      city: 'Rabat',
    },
    estimatedDistance: 12.3,
    estimatedDuration: 28,
    estimatedPrice: 35.0,
    paymentMethod: 'cash',
    passengers: 2,
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'ride_003',
    userId: 'user_003',
    status: 'searching',
    serviceType: 'sally_confort',
    pickupLocation: {
      latitude: moroccanCities.marrakech.lat,
      longitude: moroccanCities.marrakech.lon,
      address: `${getRandomStreet()}, Marrakech`,
      city: 'Marrakech',
    },
    dropoffLocation: {
      latitude: moroccanCities.marrakech.lat + 0.15,
      longitude: moroccanCities.marrakech.lon + 0.15,
      address: `${getRandomStreet()}, Marrakech`,
      city: 'Marrakech',
    },
    estimatedDistance: 25.0,
    estimatedDuration: 45,
    estimatedPrice: 125.0,
    paymentMethod: 'wallet',
    passengers: 3,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'ride_004',
    userId: 'user_001',
    driverId: 'driver_003',
    status: 'cancelled',
    serviceType: 'sally_standard',
    pickupLocation: {
      latitude: moroccanCities.casablanca.lat,
      longitude: moroccanCities.casablanca.lon,
      address: `${getRandomStreet()}, Casablanca`,
      city: 'Casablanca',
    },
    dropoffLocation: {
      latitude: moroccanCities.casablanca.lat + 0.1,
      longitude: moroccanCities.casablanca.lon + 0.1,
      address: `${getRandomStreet()}, Casablanca`,
      city: 'Casablanca',
    },
    estimatedDistance: 15.0,
    estimatedDuration: 35,
    estimatedPrice: 65.0,
    paymentMethod: 'card',
    passengers: 1,
    cancelledAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    cancellationReason: 'Driver cancelled the ride',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ride_005',
    userId: 'user_002',
    driverId: 'driver_001',
    status: 'completed',
    serviceType: 'sally_pool',
    pickupLocation: {
      latitude: moroccanCities.rabat.lat,
      longitude: moroccanCities.rabat.lon,
      address: `${getRandomStreet()}, Rabat`,
      city: 'Rabat',
    },
    dropoffLocation: {
      latitude: moroccanCities.rabat.lat + 0.12,
      longitude: moroccanCities.rabat.lon + 0.12,
      address: `${getRandomStreet()}, Rabat`,
      city: 'Rabat',
    },
    estimatedDistance: 18.5,
    estimatedDuration: 40,
    estimatedPrice: 28.0,
    actualPrice: 28.0,
    paymentMethod: 'wallet',
    passengers: 4,
    completedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    rating: 4,
    review: 'Good ride, but a bit crowded',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// MOCK SERVICES DATA
// ============================================================================

export const MOCK_SERVICES: Service[] = [
  {
    type: 'sally_eco',
    name: {
      fr: 'Sally Eco',
      ar: 'سالي إيكو',
      en: 'Sally Eco',
    },
    description: {
      fr: 'Service économique et écologique',
      ar: 'خدمة اقتصادية وصديقة للبيئة',
      en: 'Economical and eco-friendly service',
    },
    icon: 'leaf',
    color: '#22c55e',
    basePrice: 5.0,
    pricePerKm: 1.8,
    minimumFare: 15.0,
    estimatedWaitTime: { min: 5, max: 10 },
    capacity: { min: 1, max: 4 },
  },
  {
    type: 'sally_standard',
    name: {
      fr: 'Sally Standard',
      ar: 'سالي ستاندار',
      en: 'Sally Standard',
    },
    description: {
      fr: 'Service standard fiable',
      ar: 'خدمة عادية موثوقة',
      en: 'Reliable standard service',
    },
    icon: 'car',
    color: '#3b82f6',
    basePrice: 8.0,
    pricePerKm: 2.5,
    minimumFare: 25.0,
    estimatedWaitTime: { min: 3, max: 8 },
    capacity: { min: 1, max: 4 },
  },
  {
    type: 'sally_confort',
    name: {
      fr: 'Sally Confort',
      ar: 'سالي كومفور',
      en: 'Sally Comfort',
    },
    description: {
      fr: 'Service premium avec confort',
      ar: 'خدمة مميزة مع الراحة',
      en: 'Premium service with comfort',
    },
    icon: 'star',
    color: '#f59e0b',
    basePrice: 12.0,
    pricePerKm: 3.5,
    minimumFare: 40.0,
    estimatedWaitTime: { min: 2, max: 5 },
    capacity: { min: 1, max: 4 },
  },
  {
    type: 'sally_pool',
    name: {
      fr: 'Sally Pool',
      ar: 'سالي بول',
      en: 'Sally Pool',
    },
    description: {
      fr: 'Service partagé économique',
      ar: 'خدمة مشتركة اقتصادية',
      en: 'Shared economical service',
    },
    icon: 'users',
    color: '#8b5cf6',
    basePrice: 3.0,
    pricePerKm: 1.2,
    minimumFare: 10.0,
    estimatedWaitTime: { min: 8, max: 15 },
    capacity: { min: 2, max: 4 },
  },
];

// ============================================================================
// MOCK BADGES DATA
// ============================================================================

export const MOCK_BADGES: Badge[] = [
  {
    id: 'badge_basic',
    level: 'basic',
    name: {
      fr: 'Passager Basique',
      ar: 'الراكب الأساسي',
      en: 'Basic Passenger',
    },
    icon: 'person',
    color: '#6b7280',
    requirements: {
      minDocuments: 2,
      minRides: 0,
      minRating: 3.5,
    },
    benefits: [
      {
        fr: 'Accès aux services de base',
        ar: 'الوصول إلى الخدمات الأساسية',
        en: 'Access to basic services',
      },
      {
        fr: 'Support client prioritaire',
        ar: 'دعم العملاء الأولوي',
        en: 'Priority customer support',
      },
    ],
  },
  {
    id: 'badge_verified',
    level: 'verified',
    name: {
      fr: 'Passager Vérifié',
      ar: 'الراكب المُتحقق منه',
      en: 'Verified Passenger',
    },
    icon: 'check-circle',
    color: '#3b82f6',
    requirements: {
      minDocuments: 4,
      minRides: 5,
      minRating: 4.0,
    },
    benefits: [
      {
        fr: 'Tous les services disponibles',
        ar: 'جميع الخدمات متاحة',
        en: 'All services available',
      },
      {
        fr: 'Réductions 5%',
        ar: 'تخفيضات 5٪',
        en: '5% discounts',
      },
    ],
  },
  {
    id: 'badge_premium',
    level: 'premium',
    name: {
      fr: 'Passager Premium',
      ar: 'الراكب المميز',
      en: 'Premium Passenger',
    },
    icon: 'star',
    color: '#f59e0b',
    requirements: {
      minDocuments: 6,
      minRides: 25,
      minRating: 4.5,
    },
    benefits: [
      {
        fr: 'Réductions 10%',
        ar: 'تخفيضات 10٪',
        en: '10% discounts',
      },
      {
        fr: 'Accès prioritaire aux conducteurs',
        ar: 'إمكانية الوصول الأولوي للسائقين',
        en: 'Priority driver access',
      },
    ],
  },
  {
    id: 'badge_elite',
    level: 'elite',
    name: {
      fr: 'Passager Elite',
      ar: 'الراكب النخبوي',
      en: 'Elite Passenger',
    },
    icon: 'crown',
    color: '#ec4899',
    requirements: {
      minDocuments: 8,
      minRides: 100,
      minRating: 4.8,
    },
    benefits: [
      {
        fr: 'Réductions 15%',
        ar: 'تخفيضات 15٪',
        en: '15% discounts',
      },
      {
        fr: 'Service VIP personnalisé',
        ar: 'خدمة VIP مخصصة',
        en: 'Personalized VIP service',
      },
    ],
  },
];

// ============================================================================
// MOCK CHAT CONVERSATIONS DATA
// ============================================================================

export const MOCK_CHAT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv_001',
    participantIds: ['user_001', 'driver_001'],
    participantNames: ['Ahmed Benali', 'Mohammed El Fassi'],
    lastMessage: 'Thank you for the ride! See you next time.',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'conv_002',
    participantIds: ['user_002', 'driver_002'],
    participantNames: ['Fatima Bennani', 'Karim Tazi'],
    lastMessage: 'I am arriving in 2 minutes',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unreadCount: 1,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'conv_003',
    participantIds: ['user_001', 'support_001'],
    participantNames: ['Ahmed Benali', 'Sally Support'],
    lastMessage: 'Your refund has been processed successfully',
    lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// MOCK CHAT MESSAGES DATA
// ============================================================================

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_001',
    conversationId: 'conv_001',
    senderId: 'driver_001',
    senderName: 'Mohammed El Fassi',
    senderAvatar: getRandomAvatar(),
    messageType: 'text',
    content: 'Hi! I am on the way. See you in 5 minutes',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 'msg_002',
    conversationId: 'conv_001',
    senderId: 'user_001',
    senderName: 'Ahmed Benali',
    senderAvatar: getRandomAvatar(),
    messageType: 'text',
    content: 'Great! Thank you for letting me know',
    timestamp: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 'msg_003',
    conversationId: 'conv_001',
    senderId: 'driver_001',
    senderName: 'Mohammed El Fassi',
    senderAvatar: getRandomAvatar(),
    messageType: 'text',
    content: 'I am here now, at the corner of Avenue Mohammed V',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 'msg_004',
    conversationId: 'conv_001',
    senderId: 'user_001',
    senderName: 'Ahmed Benali',
    senderAvatar: getRandomAvatar(),
    messageType: 'text',
    content: 'Thank you for the ride! See you next time.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 'msg_005',
    conversationId: 'conv_002',
    senderId: 'driver_002',
    senderName: 'Karim Tazi',
    senderAvatar: getRandomAvatar(),
    messageType: 'text',
    content: 'I am arriving in 2 minutes',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: false,
  },
];

// ============================================================================
// MOCK NOTIFICATIONS DATA
// ============================================================================

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_001',
    userId: 'user_001',
    type: 'ride',
    title: 'Ride Completed',
    message: 'Your ride with Mohammed El Fassi has been completed',
    actionType: 'viewRide',
    actionData: { rideId: 'ride_001' },
    isRead: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_002',
    userId: 'user_001',
    type: 'promotion',
    title: 'Special Offer',
    message: 'Get 20% off on your next ride with Sally Confort',
    actionType: 'viewPromo',
    actionData: { promoCode: 'CONFORT20' },
    isRead: false,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_003',
    userId: 'user_002',
    type: 'message',
    title: 'New Message',
    message: 'Karim Tazi sent you a message',
    actionType: 'openChat',
    actionData: { conversationId: 'conv_002' },
    isRead: false,
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_004',
    userId: 'user_003',
    type: 'system',
    title: 'Verification Required',
    message: 'Please complete your phone verification to access all features',
    actionType: 'verify',
    actionData: { verificationType: 'phone' },
    isRead: true,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_005',
    userId: 'user_001',
    type: 'warning',
    title: 'Cancelled Ride',
    message: 'Your ride was cancelled. A refund has been issued',
    isRead: true,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// MOCK ADMIN STATS
// ============================================================================

export const MOCK_ADMIN_STATS: AdminStats = {
  totalUsers: 12450,
  totalDrivers: 3280,
  totalRides: 145620,
  totalRevenue: 2850000,
  averageRating: 4.68,
  activeDrivers: 856,
  pendingVerifications: 34,
  todayRides: 2145,
  thisMonthRevenue: 287500,
};

// ============================================================================
// MOCK ADMIN DASHBOARD DATA (Extended)
// ============================================================================

export const MOCK_ADMIN_DASHBOARD = {
  stats: MOCK_ADMIN_STATS,
  revenueByDay: [
    { date: '2025-03-10', revenue: 8500, rides: 342 },
    { date: '2025-03-11', revenue: 9200, rides: 368 },
    { date: '2025-03-12', revenue: 8800, rides: 352 },
    { date: '2025-03-13', revenue: 9500, rides: 380 },
    { date: '2025-03-14', revenue: 10200, rides: 408 },
    { date: '2025-03-15', revenue: 11500, rides: 460 },
    { date: '2025-03-16', revenue: 10800, rides: 432 },
  ],
  topDrivers: MOCK_DRIVERS.slice(0, 3).map(driver => ({
    id: driver.id,
    name: `${driver.firstName} ${driver.lastName}`,
    rides: driver.totalRides,
    rating: driver.averageRating,
    earnings: driver.totalRides * 25,
  })),
  serviceDistribution: [
    { service: 'sally_eco', count: 42000, percentage: 28.8 },
    { service: 'sally_standard', count: 58200, percentage: 39.9 },
    { service: 'sally_confort', count: 35100, percentage: 24.1 },
    { service: 'sally_pool', count: 10320, percentage: 7.1 },
  ],
  userRetention: {
    day1: 85,
    day7: 62,
    day30: 48,
    day90: 35,
  },
};

// ============================================================================
// EXPORT ALL MOCK DATA
// ============================================================================

export const STATIC_DATA = {
  users: MOCK_USERS,
  drivers: MOCK_DRIVERS,
  rides: MOCK_RIDES,
  services: MOCK_SERVICES,
  badges: MOCK_BADGES,
  conversations: MOCK_CHAT_CONVERSATIONS,
  messages: MOCK_CHAT_MESSAGES,
  notifications: MOCK_NOTIFICATIONS,
  adminStats: MOCK_ADMIN_STATS,
  adminDashboard: MOCK_ADMIN_DASHBOARD,
};

export default STATIC_DATA;
