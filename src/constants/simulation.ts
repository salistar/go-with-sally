/**
 * GO WITH SALLY - SIMULATION CONSTANTS
 * Configuration et données pour les modes OFFLINE et HYBRID
 */

import { AppMode } from '../config/appMode';
import { ServiceType } from '../types/services.types';
import { BadgeLevel } from '../types/badges.types';

export interface SimulationConfig {
  enabled: boolean;
  autoAcceptDelay: number;
  autoDriverArrival: number;
  autoRideComplete: number;
  showSimulationBadge: boolean;
  enableChatSimulation: boolean;
  enableGPSSimulation: boolean;
  messageDelay: { min: number; max: number };
}

export interface SimulatedDriver {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  rating: number;
  totalRides: number;
  vehicle: {
    brand: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  badge: BadgeLevel;
  servicesOffered: ServiceType[];
  eta: number;
}

export const SIMULATION_CONFIGS: Record<AppMode, SimulationConfig> = {
  offline: {
    enabled: true,
    autoAcceptDelay: 3000,
    autoDriverArrival: 8000,
    autoRideComplete: 20000,
    showSimulationBadge: true,
    enableChatSimulation: true,
    enableGPSSimulation: true,
    messageDelay: { min: 1000, max: 3000 },
  },
  hybrid: {
    enabled: true,
    autoAcceptDelay: 5000,
    autoDriverArrival: 12000,
    autoRideComplete: 30000,
    showSimulationBadge: true,
    enableChatSimulation: true,
    enableGPSSimulation: true,
    messageDelay: { min: 2000, max: 5000 },
  },
  online: {
    enabled: false,
    autoAcceptDelay: 0,
    autoDriverArrival: 0,
    autoRideComplete: 0,
    showSimulationBadge: false,
    enableChatSimulation: false,
    enableGPSSimulation: false,
    messageDelay: { min: 0, max: 0 },
  },
};

export const SIMULATED_MESSAGES = {
  driverAccepted: [
    { fr: "Bonjour ! Je suis en route vers vous 🚗", ar: "مرحباً! أنا في الطريق إليك 🚗", en: "Hello! I'm on my way to you 🚗" },
    { fr: "J'arrive dans quelques minutes", ar: "سأصل في بضع دقائق", en: "I'll be there in a few minutes" },
    { fr: "Je suis votre conductrice Sally 💖", ar: "أنا سائقتك سالي 💖", en: "I'm your Sally driver 💖" },
  ],
  driverArriving: [
    { fr: "Je suis presque arrivée !", ar: "أنا على وشك الوصول!", en: "I'm almost there!" },
    { fr: "Je vois votre position", ar: "أرى موقعك", en: "I can see your location" },
    { fr: "Plus que 2 minutes 🚗", ar: "دقيقتان فقط 🚗", en: "Just 2 more minutes 🚗" },
  ],
  driverArrived: [
    { fr: "Je suis arrivée ! Je vous attends 🚗", ar: "لقد وصلت! أنتظرك 🚗", en: "I've arrived! Waiting for you 🚗" },
    { fr: "Je suis devant l'entrée", ar: "أنا أمام المدخل", en: "I'm at the entrance" },
    { fr: "Prenez votre temps, je vous attends 😊", ar: "خذي وقتك، أنا في انتظارك 😊", en: "Take your time, I'm waiting 😊" },
  ],
  rideStarted: [
    { fr: "C'est parti ! Bonne route 🌟", ar: "لنذهب! رحلة سعيدة 🌟", en: "Let's go! Enjoy your ride 🌟" },
    { fr: "En route vers votre destination", ar: "في الطريق إلى وجهتك", en: "On the way to your destination" },
  ],
  rideCompleted: [
    { fr: "Nous sommes arrivées ! Merci d'avoir voyagé avec Sally 💖", ar: "لقد وصلنا! شكراً لسفرك مع سالي 💖", en: "We've arrived! Thanks for riding with Sally 💖" },
    { fr: "Bonne journée et à bientôt !", ar: "يوماً سعيداً وإلى اللقاء!", en: "Have a great day and see you soon!" },
    { fr: "Merci pour votre confiance 🌸", ar: "شكراً لثقتك 🌸", en: "Thank you for your trust 🌸" },
  ],
};

export const SIMULATED_DRIVERS: SimulatedDriver[] = [
  {
    id: 'sim_driver_001',
    firstName: 'Amina',
    lastName: 'El Amrani',
    avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    rating: 4.9,
    totalRides: 542,
    vehicle: { brand: 'Dacia', model: 'Logan', color: 'Blanc', plateNumber: '12345-A-1' },
    badge: 'verified',
    servicesOffered: ['sally_standard', 'sally_eco'],
    eta: 5,
  },
  {
    id: 'sim_driver_002',
    firstName: 'Fatima',
    lastName: 'Benali',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4.8,
    totalRides: 328,
    vehicle: { brand: 'Renault', model: 'Clio', color: 'Gris', plateNumber: '54321-B-2' },
    badge: 'premium',
    servicesOffered: ['sally_standard', 'sally_confort'],
    eta: 7,
  },
  {
    id: 'sim_driver_003',
    firstName: 'Khadija',
    lastName: 'Mansouri',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    rating: 4.95,
    totalRides: 1247,
    vehicle: { brand: 'Mercedes', model: 'Classe C', color: 'Noir', plateNumber: '98765-C-3' },
    badge: 'elite',
    servicesOffered: ['sally_confort', 'sally_standard'],
    eta: 4,
  },
  {
    id: 'sim_driver_004',
    firstName: 'Salma',
    lastName: 'Chakir',
    avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
    rating: 4.7,
    totalRides: 156,
    vehicle: { brand: 'Peugeot', model: '208', color: 'Rouge', plateNumber: '11111-D-4' },
    badge: 'basic',
    servicesOffered: ['sally_eco', 'sally_pool'],
    eta: 8,
  },
  {
    id: 'sim_driver_005',
    firstName: 'Nadia',
    lastName: 'Tazi',
    avatar: 'https://randomuser.me/api/portraits/women/72.jpg',
    rating: 4.85,
    totalRides: 789,
    vehicle: { brand: 'Volkswagen', model: 'Golf', color: 'Bleu', plateNumber: '22222-E-5' },
    badge: 'verified',
    servicesOffered: ['sally_standard', 'sally_pool'],
    eta: 6,
  },
];

export default {
  SIMULATION_CONFIGS,
  SIMULATED_MESSAGES,
  SIMULATED_DRIVERS,
};