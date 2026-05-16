/**
 * GO WITH SALLY - SIMULATION TYPES
 */

import { ServiceType } from './services.types';
import { BadgeLevel } from './badges.types';

export type RideStatus = 
  | 'pending'
  | 'searching'
  | 'accepted'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface SimulationState {
  isActive: boolean;
  currentRideId: string | null;
  simulatedDriverId: string | null;
  timers: NodeJS.Timeout[];
  locationUpdateInterval: NodeJS.Timeout | null;
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
  phone?: string;
}

export interface SimulatedRideRequest {
  rideId: string;
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  serviceType: ServiceType;
  proposedPrice: number;
  passengerId: string;
}

export interface SimulatedMessage {
  fr: string;
  ar: string;
  en: string;
}

export interface SimulationConfig {
  enabled: boolean;
  autoAcceptDelay: number;
  autoDriverArrival: number;
  autoRideComplete: number;
  showSimulationBadge: boolean;
  enableChatSimulation: boolean;
  enableGPSSimulation: boolean;
  messageDelay: {
    min: number;
    max: number;
  };
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  timestamp: number;
}

export interface SimulatedChatMessage {
  conversationId: string;
  content: string;
  senderId: string;
  type: 'text' | 'image' | 'location';
  isSimulated: boolean;
  timestamp: string;
}