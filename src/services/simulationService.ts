/**
 * ============================================================================
 * GO WITH SALLY - SIMULATION SERVICE
 * ============================================================================
 * Service de simulation pour le mode offline/test
 * Génère des données réalistes pour tester l'application sans backend
 * 
 * @module services/simulationService
 * @version 1.0.0
 * ============================================================================
 */

import { ServiceType } from '../types/services.types';

// ============================================================================
// TYPES
// ============================================================================

export interface SimulatedLocation {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

export interface SimulatedDriver {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  phone: string;
  rating: number;
  totalRides: number;
  vehicle: {
    brand: string;
    model: string;
    color: string;
    plateNumber: string;
    year: number;
  };
  badge: 'none' | 'basic' | 'verified' | 'premium' | 'elite';
  location: SimulatedLocation;
  servicesOffered: ServiceType[];
  isOnline: boolean;
  eta: number; // minutes
}

export interface SimulatedRide {
  id: string;
  status: RideStatus;
  serviceType: ServiceType;
  pickup: SimulatedLocation;
  destination: SimulatedLocation;
  driver: SimulatedDriver | null;
  price: number;
  proposedPrice: number;
  distance: number;
  duration: number;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export type RideStatus = 
  | 'pending'
  | 'searching'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface SimulationConfig {
  searchDurationMs: number;
  acceptanceChance: number;
  arrivalTimeMinutes: number;
  rideDurationMultiplier: number;
  autoProgress: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Noms féminins marocains
const FEMALE_FIRST_NAMES = [
  'Fatima', 'Amina', 'Khadija', 'Aicha', 'Meryem', 'Zineb', 'Sara', 'Nadia',
  'Houda', 'Salma', 'Laila', 'Hiba', 'Imane', 'Yasmine', 'Rania', 'Sanaa',
  'Loubna', 'Hajar', 'Soukaina', 'Ilham', 'Wafa', 'Rajae', 'Nawal', 'Lamiae',
];

const LAST_NAMES = [
  'Benali', 'El Amrani', 'Mansouri', 'Tazi', 'Berrada', 'Alaoui', 'Fassi',
  'Idrissi', 'Bennani', 'Chraibi', 'Sebti', 'Kadiri', 'Lahlou', 'Benjelloun',
  'El Ouazzani', 'Benmoussa', 'Tahiri', 'Rhali', 'Sentissi', 'Kettani',
];

// Véhicules populaires au Maroc
const VEHICLES = [
  { brand: 'Dacia', model: 'Logan', colors: ['Blanc', 'Gris', 'Noir'] },
  { brand: 'Dacia', model: 'Sandero', colors: ['Blanc', 'Rouge', 'Bleu'] },
  { brand: 'Renault', model: 'Clio', colors: ['Gris', 'Noir', 'Blanc'] },
  { brand: 'Peugeot', model: '208', colors: ['Blanc', 'Noir', 'Bleu'] },
  { brand: 'Hyundai', model: 'i10', colors: ['Blanc', 'Gris', 'Rouge'] },
  { brand: 'Fiat', model: 'Tipo', colors: ['Blanc', 'Gris', 'Noir'] },
  { brand: 'Volkswagen', model: 'Polo', colors: ['Blanc', 'Noir', 'Gris'] },
  { brand: 'Toyota', model: 'Yaris', colors: ['Blanc', 'Gris', 'Bleu'] },
  { brand: 'Citroen', model: 'C3', colors: ['Blanc', 'Rouge', 'Orange'] },
  { brand: 'Kia', model: 'Picanto', colors: ['Blanc', 'Bleu', 'Gris'] },
];

// Véhicules premium
const PREMIUM_VEHICLES = [
  { brand: 'Mercedes', model: 'Classe C', colors: ['Noir', 'Gris', 'Blanc'] },
  { brand: 'BMW', model: 'Série 3', colors: ['Noir', 'Blanc', 'Bleu'] },
  { brand: 'Audi', model: 'A4', colors: ['Noir', 'Gris', 'Blanc'] },
  { brand: 'Volvo', model: 'S60', colors: ['Noir', 'Blanc', 'Gris'] },
];

// Lieux populaires à Casablanca
const CASABLANCA_LOCATIONS: SimulatedLocation[] = [
  { lat: 33.5731, lng: -7.5898, address: 'Place Mohammed V, Casablanca', name: 'Place Mohammed V' },
  { lat: 33.5883, lng: -7.6114, address: 'Morocco Mall, Casablanca', name: 'Morocco Mall' },
  { lat: 33.5950, lng: -7.6187, address: 'Aïn Diab, Casablanca', name: 'Corniche Aïn Diab' },
  { lat: 33.5333, lng: -7.5833, address: 'Casa Port, Casablanca', name: 'Gare Casa Port' },
  { lat: 33.5486, lng: -7.6039, address: 'Maarif, Casablanca', name: 'Quartier Maarif' },
  { lat: 33.5697, lng: -7.6231, address: 'Anfa, Casablanca', name: 'Anfa Place' },
  { lat: 33.5892, lng: -7.5525, address: 'Sidi Maarouf, Casablanca', name: 'Sidi Maarouf' },
  { lat: 33.6031, lng: -7.5478, address: 'Bouskoura, Casablanca', name: 'Bouskoura' },
  { lat: 33.5628, lng: -7.6228, address: 'Gauthier, Casablanca', name: 'Quartier Gauthier' },
  { lat: 33.5989, lng: -7.6344, address: 'Mosquée Hassan II, Casablanca', name: 'Mosquée Hassan II' },
];

// Avatars féminins
const FEMALE_AVATARS = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/women/3.jpg',
  'https://randomuser.me/api/portraits/women/4.jpg',
  'https://randomuser.me/api/portraits/women/5.jpg',
  'https://randomuser.me/api/portraits/women/6.jpg',
  'https://randomuser.me/api/portraits/women/7.jpg',
  'https://randomuser.me/api/portraits/women/8.jpg',
  'https://randomuser.me/api/portraits/women/9.jpg',
  'https://randomuser.me/api/portraits/women/10.jpg',
  'https://randomuser.me/api/portraits/women/11.jpg',
  'https://randomuser.me/api/portraits/women/12.jpg',
];

// Configuration par défaut
const DEFAULT_CONFIG: SimulationConfig = {
  searchDurationMs: 5000,
  acceptanceChance: 0.85,
  arrivalTimeMinutes: 5,
  rideDurationMultiplier: 1.0,
  autoProgress: true,
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

class SimulationService {
  private config: SimulationConfig = DEFAULT_CONFIG;
  private activeRide: SimulatedRide | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private progressTimers: ReturnType<typeof setTimeout>[] = [];
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Configure les paramètres de simulation
   */
  configure(config: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[SimulationService] ⚙️ Configuration mise à jour:', this.config);
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  /**
   * Réinitialise la configuration par défaut
   */
  resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  // ==========================================================================
  // DRIVER GENERATION
  // ==========================================================================

  /**
   * Génère une conductrice simulée
   */
  generateDriver(options?: {
    badge?: SimulatedDriver['badge'];
    serviceType?: ServiceType;
    nearLocation?: SimulatedLocation;
  }): SimulatedDriver {
    const firstName = this.randomItem(FEMALE_FIRST_NAMES);
    const lastName = this.randomItem(LAST_NAMES);
    const badge = options?.badge || this.randomBadge();
    
    // Sélectionner véhicule selon le badge
    const vehiclePool = badge === 'premium' || badge === 'elite' ? PREMIUM_VEHICLES : VEHICLES;
    const vehicleType = this.randomItem(vehiclePool);
    
    // Générer position proche si spécifié
    let location: SimulatedLocation;
    if (options?.nearLocation) {
      location = this.generateNearbyLocation(options.nearLocation, 2); // 2km radius
    } else {
      location = this.randomItem(CASABLANCA_LOCATIONS);
    }

    // Services offerts selon le badge
    let servicesOffered: ServiceType[] = ['sally_standard', 'sally_eco'];
    if (badge === 'premium' || badge === 'elite') {
      servicesOffered.push('sally_confort');
    }
    if (badge === 'basic' || badge === 'verified') {
      servicesOffered.push('sally_pool');
    }

    return {
      id: `driver_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firstName,
      lastName,
      avatar: this.randomItem(FEMALE_AVATARS),
      phone: this.generatePhoneNumber(),
      rating: this.randomFloat(4.5, 5.0, 1),
      totalRides: this.randomInt(50, 2000),
      vehicle: {
        brand: vehicleType.brand,
        model: vehicleType.model,
        color: this.randomItem(vehicleType.colors),
        plateNumber: this.generatePlateNumber(),
        year: this.randomInt(2018, 2024),
      },
      badge,
      location,
      servicesOffered,
      isOnline: true,
      eta: this.randomInt(3, 12),
    };
  }

  /**
   * Génère plusieurs conductrices
   */
  generateDrivers(count: number, options?: {
    nearLocation?: SimulatedLocation;
    serviceType?: ServiceType;
  }): SimulatedDriver[] {
    return Array.from({ length: count }, () => this.generateDriver(options));
  }

  // ==========================================================================
  // RIDE SIMULATION
  // ==========================================================================

  /**
   * Simule une recherche de conductrice
   */
  async searchForDriver(params: {
    pickup: SimulatedLocation;
    destination: SimulatedLocation;
    serviceType: ServiceType;
    proposedPrice: number;
    suggestedPrice: number;
  }): Promise<{ success: boolean; driver?: SimulatedDriver; ride?: SimulatedRide }> {
    console.log('[SimulationService] 🔍 Recherche de conductrice...');

    // Créer la course en attente
    this.activeRide = {
      id: `ride_sim_${Date.now()}`,
      status: 'searching',
      serviceType: params.serviceType,
      pickup: params.pickup,
      destination: params.destination,
      driver: null,
      price: params.suggestedPrice,
      proposedPrice: params.proposedPrice,
      distance: this.calculateDistance(params.pickup, params.destination),
      duration: this.estimateDuration(params.pickup, params.destination),
      createdAt: new Date().toISOString(),
    };

    this.emit('ride:searching', this.activeRide);

    return new Promise((resolve) => {
      // Simuler le temps de recherche
      const searchTime = this.config.searchDurationMs + this.randomInt(-1000, 2000);
      
      this.searchTimer = setTimeout(() => {
        // Calculer la chance d'acceptation basée sur le prix
        const priceRatio = params.proposedPrice / params.suggestedPrice;
        let acceptanceChance = this.config.acceptanceChance;
        
        if (priceRatio >= 1.15) acceptanceChance = 0.98;
        else if (priceRatio >= 1.0) acceptanceChance = 0.90;
        else if (priceRatio >= 0.85) acceptanceChance = 0.70;
        else acceptanceChance = 0.40;

        const accepted = Math.random() < acceptanceChance;

        if (accepted) {
          const driver = this.generateDriver({
            nearLocation: params.pickup,
            serviceType: params.serviceType,
          });

          this.activeRide!.driver = driver;
          this.activeRide!.status = 'driver_assigned';
          this.activeRide!.acceptedAt = new Date().toISOString();

          console.log('[SimulationService] ✅ Conductrice trouvée:', driver.firstName);
          this.emit('ride:driver_assigned', { ride: this.activeRide, driver });

          // Auto-progression si activée
          if (this.config.autoProgress) {
            this.startAutoProgression();
          }

          resolve({ success: true, driver, ride: this.activeRide! });
        } else {
          this.activeRide!.status = 'cancelled';
          this.activeRide!.cancelledAt = new Date().toISOString();
          this.activeRide!.cancellationReason = 'no_driver_available';

          console.log('[SimulationService] ❌ Aucune conductrice disponible');
          this.emit('ride:no_driver', this.activeRide);

          resolve({ success: false });
        }
      }, searchTime);
    });
  }

  /**
   * Démarre la progression automatique de la course
   */
  private startAutoProgression(): void {
    if (!this.activeRide) return;

    const progressionSteps = [
      { status: 'driver_arriving' as RideStatus, delay: 2000 },
      { status: 'driver_arrived' as RideStatus, delay: this.config.arrivalTimeMinutes * 60 * 1000 },
      { status: 'in_progress' as RideStatus, delay: 5000 },
      { status: 'completed' as RideStatus, delay: this.activeRide.duration * 60 * 1000 * this.config.rideDurationMultiplier },
    ];

    let totalDelay = 0;

    progressionSteps.forEach((step) => {
      totalDelay += step.delay;
      
      const timer = setTimeout(() => {
        if (this.activeRide && this.activeRide.status !== 'cancelled') {
          this.activeRide.status = step.status;
          
          if (step.status === 'in_progress') {
            this.activeRide.startedAt = new Date().toISOString();
          } else if (step.status === 'completed') {
            this.activeRide.completedAt = new Date().toISOString();
          }

          console.log(`[SimulationService] 🔄 Status: ${step.status}`);
          this.emit(`ride:${step.status}`, this.activeRide);
        }
      }, totalDelay);

      this.progressTimers.push(timer);
    });
  }

  /**
   * Force le passage à un statut spécifique
   */
  forceStatus(status: RideStatus): void {
    if (!this.activeRide) return;

    this.activeRide.status = status;
    
    if (status === 'in_progress') {
      this.activeRide.startedAt = new Date().toISOString();
    } else if (status === 'completed') {
      this.activeRide.completedAt = new Date().toISOString();
    } else if (status === 'cancelled') {
      this.activeRide.cancelledAt = new Date().toISOString();
    }

    console.log(`[SimulationService] ⚡ Force status: ${status}`);
    this.emit(`ride:${status}`, this.activeRide);
  }

  /**
   * Annule la recherche ou la course en cours
   */
  cancelRide(reason?: string): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }

    this.progressTimers.forEach(timer => clearTimeout(timer));
    this.progressTimers = [];

    if (this.activeRide) {
      this.activeRide.status = 'cancelled';
      this.activeRide.cancelledAt = new Date().toISOString();
      this.activeRide.cancellationReason = reason || 'user_cancelled';

      console.log('[SimulationService] 🚫 Course annulée:', reason);
      this.emit('ride:cancelled', this.activeRide);
    }

    this.activeRide = null;
  }

  /**
   * Récupère la course active
   */
  getActiveRide(): SimulatedRide | null {
    return this.activeRide;
  }

  // ==========================================================================
  // LOCATION SIMULATION
  // ==========================================================================

  /**
   * Génère une position proche d'une autre
   */
  generateNearbyLocation(center: SimulatedLocation, radiusKm: number): SimulatedLocation {
    const earthRadius = 6371; // km
    const latOffset = (radiusKm / earthRadius) * (180 / Math.PI);
    const lngOffset = latOffset / Math.cos(center.lat * (Math.PI / 180));

    const lat = center.lat + (Math.random() - 0.5) * 2 * latOffset;
    const lng = center.lng + (Math.random() - 0.5) * 2 * lngOffset;

    return {
      lat,
      lng,
      address: `${this.randomItem(['Rue', 'Avenue', 'Boulevard'])} ${this.randomItem(LAST_NAMES)}, Casablanca`,
    };
  }

  /**
   * Simule le déplacement d'une conductrice
   */
  simulateDriverMovement(
    driver: SimulatedDriver, 
    destination: SimulatedLocation, 
    durationMs: number,
    onUpdate?: (location: SimulatedLocation) => void
  ): () => void {
    const startLat = driver.location.lat;
    const startLng = driver.location.lng;
    const steps = 20;
    const stepDuration = durationMs / steps;

    let currentStep = 0;

    const moveInterval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      driver.location = {
        lat: startLat + (destination.lat - startLat) * progress,
        lng: startLng + (destination.lng - startLng) * progress,
        address: driver.location.address,
      };

      this.emit('driver:location_updated', driver);
      onUpdate?.(driver.location);

      if (currentStep >= steps) {
        clearInterval(moveInterval);
        driver.location = destination;
        this.emit('driver:arrived', driver);
      }
    }, stepDuration);

    // Retourne une fonction pour arrêter la simulation
    return () => clearInterval(moveInterval);
  }

  /**
   * Récupère des lieux populaires
   */
  getPopularLocations(): SimulatedLocation[] {
    return [...CASABLANCA_LOCATIONS];
  }

  /**
   * Récupère un lieu aléatoire
   */
  getRandomLocation(): SimulatedLocation {
    return this.randomItem(CASABLANCA_LOCATIONS);
  }

  /**
   * Récupère un lieu par nom
   */
  getLocationByName(name: string): SimulatedLocation | undefined {
    return CASABLANCA_LOCATIONS.find(loc => 
      loc.name?.toLowerCase().includes(name.toLowerCase()) ||
      loc.address.toLowerCase().includes(name.toLowerCase())
    );
  }

  // ==========================================================================
  // RIDE HISTORY
  // ==========================================================================

  /**
   * Génère un historique de courses simulé
   */
  generateRideHistory(count: number): SimulatedRide[] {
    const rides: SimulatedRide[] = [];

    for (let i = 0; i < count; i++) {
      const pickup = this.randomItem(CASABLANCA_LOCATIONS);
      const destination = this.randomItem(CASABLANCA_LOCATIONS.filter(l => l !== pickup));
      const distance = this.calculateDistance(pickup, destination);
      const duration = this.estimateDuration(pickup, destination);
      const serviceType = this.randomItem(['sally_standard', 'sally_eco', 'sally_confort', 'sally_pool'] as ServiceType[]);
      
      // Prix basé sur le service
      const basePrices = { sally_eco: 15, sally_standard: 25, sally_confort: 40, sally_pool: 12 };
      const price = basePrices[serviceType] + Math.round(distance * 4);

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - this.randomInt(1, 30));

      rides.push({
        id: `ride_hist_${i}_${Date.now()}`,
        status: 'completed',
        serviceType,
        pickup,
        destination,
        driver: this.generateDriver(),
        price,
        proposedPrice: price,
        distance,
        duration,
        createdAt: createdAt.toISOString(),
        acceptedAt: new Date(createdAt.getTime() + 60000).toISOString(),
        startedAt: new Date(createdAt.getTime() + 300000).toISOString(),
        completedAt: new Date(createdAt.getTime() + duration * 60000 + 300000).toISOString(),
      });
    }

    return rides.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ==========================================================================
  // EVENTS
  // ==========================================================================

  /**
   * S'abonne à un événement
   */
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Retourne une fonction de désabonnement
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * S'abonne à un événement une seule fois
   */
  once(event: string, callback: (data: any) => void): () => void {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      callback(data);
    });
    return unsubscribe;
  }

  /**
   * Émet un événement
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private randomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomFloat(min: number, max: number, decimals: number = 2): number {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
  }

  private randomBadge(): SimulatedDriver['badge'] {
    const weights = { none: 0.1, basic: 0.3, verified: 0.35, premium: 0.2, elite: 0.05 };
    const random = Math.random();
    let cumulative = 0;
    
    for (const [badge, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random < cumulative) {
        return badge as SimulatedDriver['badge'];
      }
    }
    return 'verified';
  }

  private generatePhoneNumber(): string {
    const prefixes = ['06', '07'];
    const prefix = this.randomItem(prefixes);
    const number = Array.from({ length: 8 }, () => this.randomInt(0, 9)).join('');
    return `+212${prefix.slice(1)}${number}`;
  }

  private generatePlateNumber(): string {
    const number = this.randomInt(10000, 99999);
    const letter = String.fromCharCode(65 + this.randomInt(0, 25)); // A-Z
    const region = this.randomInt(1, 80);
    return `${number}-${letter}-${region}`;
  }

  private calculateDistance(from: SimulatedLocation, to: SimulatedLocation): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(to.lat - from.lat);
    const dLon = this.deg2rad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(from.lat)) * Math.cos(this.deg2rad(to.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private estimateDuration(from: SimulatedLocation, to: SimulatedLocation): number {
    const distance = this.calculateDistance(from, to);
    // Estimation: 25 km/h en moyenne à Casablanca (trafic)
    const baseMinutes = (distance / 25) * 60;
    // Ajouter variabilité
    return Math.round(baseMinutes * (1 + Math.random() * 0.3));
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Nettoie toutes les simulations en cours
   */
  cleanup(): void {
    this.cancelRide('cleanup');
    this.listeners.clear();
    console.log('[SimulationService] 🧹 Nettoyé');
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const simulationService = new SimulationService();
export default simulationService;