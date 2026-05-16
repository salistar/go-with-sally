/**
 * ============================================================================
 * GO WITH SALLY - UNIFIED DATA SERVICE
 * ============================================================================
 * Centralized data management layer supporting offline/hybrid/online modes
 *
 * Features:
 * - Offline mode: Returns static mock data
 * - Hybrid mode: Tries API first, falls back to static data on error
 * - Online mode: Only uses API
 *
 * Methods:
 * - getProfile(userId) - Get user profile
 * - getDriver(driverId) - Get driver details
 * - getDrivers() - Get list of all drivers
 * - getNearbyDrivers(lat, lon, radiusKm) - Get drivers near location
 * - getRides(userId, status) - Get user rides
 * - getRideDetails(rideId) - Get ride details
 * - getServices() - Get available services
 * - getServiceEstimate() - Get service estimate
 * - getNotifications(userId) - Get user notifications
 * - getChatConversations(userId) - Get chat conversations
 * - getChatMessages(conversationId) - Get chat messages
 * - getBadges() - Get available badges
 * - getAdminStats() - Get admin dashboard stats
 *
 * @module services/dataService
 * @version 1.0.0
 * ============================================================================
 */

import axios from 'axios';
import {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  API_URL,
  getModeEmoji,
} from '../config/appMode';
import {
  STATIC_DATA,
  User,
  Driver,
  Ride,
  Service,
  Badge,
  ChatConversation,
  ChatMessage,
  Notification,
  AdminStats,
} from '../mocks/staticData';

// ============================================================================
// CONSTANTS
// ============================================================================

const FILE_NAME = '[dataService.ts]';
const REQUEST_TIMEOUT = 5000; // 5 seconds

// ============================================================================
// TYPES
// ============================================================================

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ServiceEstimate {
  serviceType: string;
  estimatedPrice: number;
  estimatedDuration: number;
  estimatedDistance: number;
  isAvailable: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Make API call with timeout
 */
async function apiCall<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const config = {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    let response;
    const url = `${API_URL}${endpoint}`;

    if (method === 'GET') {
      response = await axios.get<ApiResponse<T>>(url, config);
    } else if (method === 'POST') {
      response = await axios.post<ApiResponse<T>>(url, data, config);
    } else if (method === 'PUT') {
      response = await axios.put<ApiResponse<T>>(url, data, config);
    } else if (method === 'DELETE') {
      response = await axios.delete<ApiResponse<T>>(url, config);
    }

    return {
      success: response?.data?.success || true,
      data: response?.data?.data || response?.data,
    };
  } catch (error: any) {
    const errorMsg = error.message || 'API call failed';
    console.log(
      `${FILE_NAME} ❌ API Error [${method} ${endpoint}]: ${errorMsg}`
    );
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Log data source
 */
function logSource(method: string, source: 'api' | 'mock') {
  const sourceEmoji = source === 'api' ? '🌐' : '💾';
  const sourceText = source === 'api' ? 'API' : 'MOCK';
  console.log(
    `${FILE_NAME} ${sourceEmoji} ${method} - Data from ${sourceText}`
  );
}

// ============================================================================
// DATA SERVICE
// ============================================================================

export class DataService {
  private static instance: DataService;

  private constructor() {
    console.log(`${FILE_NAME} ════════════════════════════════════════════════`);
    console.log(`${FILE_NAME} 📊 DataService Initialized`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════════════`);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // ========================================================================
  // USER METHODS
  // ========================================================================

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<User | null> {
    if (IS_OFFLINE) {
      logSource('getProfile', 'mock');
      return (
        STATIC_DATA.users.find((u) => u.id === userId) || null
      );
    }

    if (IS_HYBRID) {
      const result = await apiCall<User>('GET', `/users/${userId}`);
      if (result.success && result.data) {
        logSource('getProfile', 'api');
        return result.data;
      }
      logSource('getProfile', 'mock');
      return STATIC_DATA.users.find((u) => u.id === userId) || null;
    }

    // IS_ONLINE
    const result = await apiCall<User>('GET', `/users/${userId}`);
    logSource('getProfile', 'api');
    return result.data || null;
  }

  /**
   * Get current user (convenience method)
   */
  async getCurrentUser(userId: string): Promise<User | null> {
    return this.getProfile(userId);
  }

  // ========================================================================
  // DRIVER METHODS
  // ========================================================================

  /**
   * Get driver by ID
   */
  async getDriver(driverId: string): Promise<Driver | null> {
    if (IS_OFFLINE) {
      logSource('getDriver', 'mock');
      return STATIC_DATA.drivers.find((d) => d.id === driverId) || null;
    }

    if (IS_HYBRID) {
      const result = await apiCall<Driver>('GET', `/drivers/${driverId}`);
      if (result.success && result.data) {
        logSource('getDriver', 'api');
        return result.data;
      }
      logSource('getDriver', 'mock');
      return STATIC_DATA.drivers.find((d) => d.id === driverId) || null;
    }

    // IS_ONLINE
    const result = await apiCall<Driver>('GET', `/drivers/${driverId}`);
    logSource('getDriver', 'api');
    return result.data || null;
  }

  /**
   * Get all drivers
   */
  async getDrivers(): Promise<Driver[]> {
    if (IS_OFFLINE) {
      logSource('getDrivers', 'mock');
      return STATIC_DATA.drivers;
    }

    if (IS_HYBRID) {
      const result = await apiCall<Driver[]>('GET', '/drivers');
      if (result.success && result.data) {
        logSource('getDrivers', 'api');
        return result.data;
      }
      logSource('getDrivers', 'mock');
      return STATIC_DATA.drivers;
    }

    // IS_ONLINE
    const result = await apiCall<Driver[]>('GET', '/drivers');
    logSource('getDrivers', 'api');
    return result.data || [];
  }

  /**
   * Get nearby drivers within a radius
   */
  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<Driver[]> {
    if (IS_OFFLINE) {
      logSource('getNearbyDrivers', 'mock');
      return STATIC_DATA.drivers.filter((driver) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          driver.currentLocation.latitude,
          driver.currentLocation.longitude
        );
        return distance <= radiusKm && driver.isOnline;
      });
    }

    if (IS_HYBRID) {
      const result = await apiCall<Driver[]>('GET', '/drivers/nearby', {
        latitude,
        longitude,
        radiusKm,
      });
      if (result.success && result.data) {
        logSource('getNearbyDrivers', 'api');
        return result.data;
      }
      logSource('getNearbyDrivers', 'mock');
      return STATIC_DATA.drivers.filter((driver) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          driver.currentLocation.latitude,
          driver.currentLocation.longitude
        );
        return distance <= radiusKm && driver.isOnline;
      });
    }

    // IS_ONLINE
    const result = await apiCall<Driver[]>('GET', '/drivers/nearby', {
      latitude,
      longitude,
      radiusKm,
    });
    logSource('getNearbyDrivers', 'api');
    return result.data || [];
  }

  /**
   * Get online drivers
   */
  async getOnlineDrivers(): Promise<Driver[]> {
    if (IS_OFFLINE) {
      logSource('getOnlineDrivers', 'mock');
      return STATIC_DATA.drivers.filter((d) => d.isOnline);
    }

    if (IS_HYBRID) {
      const result = await apiCall<Driver[]>('GET', '/drivers/online');
      if (result.success && result.data) {
        logSource('getOnlineDrivers', 'api');
        return result.data;
      }
      logSource('getOnlineDrivers', 'mock');
      return STATIC_DATA.drivers.filter((d) => d.isOnline);
    }

    // IS_ONLINE
    const result = await apiCall<Driver[]>('GET', '/drivers/online');
    logSource('getOnlineDrivers', 'api');
    return result.data || [];
  }

  // ========================================================================
  // RIDE METHODS
  // ========================================================================

  /**
   * Get rides for a user
   */
  async getRides(
    userId: string,
    status?: RideStatus
  ): Promise<Ride[]> {
    if (IS_OFFLINE) {
      logSource('getRides', 'mock');
      let rides = STATIC_DATA.rides.filter((r) => r.userId === userId);
      if (status) {
        rides = rides.filter((r) => r.status === status);
      }
      return rides;
    }

    if (IS_HYBRID) {
      const endpoint = status ? `/users/${userId}/rides?status=${status}` : `/users/${userId}/rides`;
      const result = await apiCall<Ride[]>('GET', endpoint);
      if (result.success && result.data) {
        logSource('getRides', 'api');
        return result.data;
      }
      logSource('getRides', 'mock');
      let rides = STATIC_DATA.rides.filter((r) => r.userId === userId);
      if (status) {
        rides = rides.filter((r) => r.status === status);
      }
      return rides;
    }

    // IS_ONLINE
    const endpoint = status ? `/users/${userId}/rides?status=${status}` : `/users/${userId}/rides`;
    const result = await apiCall<Ride[]>('GET', endpoint);
    logSource('getRides', 'api');
    return result.data || [];
  }

  /**
   * Get ride details
   */
  async getRideDetails(rideId: string): Promise<Ride | null> {
    if (IS_OFFLINE) {
      logSource('getRideDetails', 'mock');
      return STATIC_DATA.rides.find((r) => r.id === rideId) || null;
    }

    if (IS_HYBRID) {
      const result = await apiCall<Ride>('GET', `/rides/${rideId}`);
      if (result.success && result.data) {
        logSource('getRideDetails', 'api');
        return result.data;
      }
      logSource('getRideDetails', 'mock');
      return STATIC_DATA.rides.find((r) => r.id === rideId) || null;
    }

    // IS_ONLINE
    const result = await apiCall<Ride>('GET', `/rides/${rideId}`);
    logSource('getRideDetails', 'api');
    return result.data || null;
  }

  /**
   * Get completed rides
   */
  async getCompletedRides(userId: string): Promise<Ride[]> {
    return this.getRides(userId, 'completed');
  }

  /**
   * Get in-progress rides
   */
  async getInProgressRides(userId: string): Promise<Ride[]> {
    return this.getRides(userId, 'in_progress');
  }

  // ========================================================================
  // SERVICE METHODS
  // ========================================================================

  /**
   * Get all available services
   */
  async getServices(): Promise<Service[]> {
    if (IS_OFFLINE) {
      logSource('getServices', 'mock');
      return STATIC_DATA.services;
    }

    if (IS_HYBRID) {
      const result = await apiCall<Service[]>('GET', '/services');
      if (result.success && result.data) {
        logSource('getServices', 'api');
        return result.data;
      }
      logSource('getServices', 'mock');
      return STATIC_DATA.services;
    }

    // IS_ONLINE
    const result = await apiCall<Service[]>('GET', '/services');
    logSource('getServices', 'api');
    return result.data || [];
  }

  /**
   * Get service estimate
   */
  async getServiceEstimate(
    serviceType: ServiceType,
    pickupLat: number,
    pickupLon: number,
    dropoffLat: number,
    dropoffLon: number
  ): Promise<ServiceEstimate | null> {
    const distance = calculateDistance(
      pickupLat,
      pickupLon,
      dropoffLat,
      dropoffLon
    );
    const duration = Math.round((distance / 40) * 60); // Rough estimate: 40 km/h

    const service = STATIC_DATA.services.find((s) => s.type === serviceType);
    if (!service) return null;

    const estimatedPrice =
      service.basePrice + service.pricePerKm * distance;
    const finalPrice = Math.max(estimatedPrice, service.minimumFare);

    if (IS_OFFLINE) {
      logSource('getServiceEstimate', 'mock');
      return {
        serviceType,
        estimatedPrice: finalPrice,
        estimatedDuration: duration,
        estimatedDistance: distance,
        isAvailable: true,
      };
    }

    if (IS_HYBRID) {
      const result = await apiCall<ServiceEstimate>('POST', '/services/estimate', {
        serviceType,
        pickupLat,
        pickupLon,
        dropoffLat,
        dropoffLon,
      });
      if (result.success && result.data) {
        logSource('getServiceEstimate', 'api');
        return result.data;
      }
      logSource('getServiceEstimate', 'mock');
      return {
        serviceType,
        estimatedPrice: finalPrice,
        estimatedDuration: duration,
        estimatedDistance: distance,
        isAvailable: true,
      };
    }

    // IS_ONLINE
    const result = await apiCall<ServiceEstimate>('POST', '/services/estimate', {
      serviceType,
      pickupLat,
      pickupLon,
      dropoffLat,
      dropoffLon,
    });
    logSource('getServiceEstimate', 'api');
    return result.data || null;
  }

  // ========================================================================
  // BADGE METHODS
  // ========================================================================

  /**
   * Get all available badges
   */
  async getBadges(): Promise<Badge[]> {
    if (IS_OFFLINE) {
      logSource('getBadges', 'mock');
      return STATIC_DATA.badges;
    }

    if (IS_HYBRID) {
      const result = await apiCall<Badge[]>('GET', '/badges');
      if (result.success && result.data) {
        logSource('getBadges', 'api');
        return result.data;
      }
      logSource('getBadges', 'mock');
      return STATIC_DATA.badges;
    }

    // IS_ONLINE
    const result = await apiCall<Badge[]>('GET', '/badges');
    logSource('getBadges', 'api');
    return result.data || [];
  }

  // ========================================================================
  // NOTIFICATION METHODS
  // ========================================================================

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string): Promise<Notification[]> {
    if (IS_OFFLINE) {
      logSource('getNotifications', 'mock');
      return STATIC_DATA.notifications.filter((n) => n.userId === userId);
    }

    if (IS_HYBRID) {
      const result = await apiCall<Notification[]>(
        'GET',
        `/users/${userId}/notifications`
      );
      if (result.success && result.data) {
        logSource('getNotifications', 'api');
        return result.data;
      }
      logSource('getNotifications', 'mock');
      return STATIC_DATA.notifications.filter((n) => n.userId === userId);
    }

    // IS_ONLINE
    const result = await apiCall<Notification[]>(
      'GET',
      `/users/${userId}/notifications`
    );
    logSource('getNotifications', 'api');
    return result.data || [];
  }

  /**
   * Get unread notifications count
   */
  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId);
    return notifications.filter((n) => !n.isRead).length;
  }

  // ========================================================================
  // CHAT METHODS
  // ========================================================================

  /**
   * Get chat conversations for a user
   */
  async getChatConversations(userId: string): Promise<ChatConversation[]> {
    if (IS_OFFLINE) {
      logSource('getChatConversations', 'mock');
      return STATIC_DATA.conversations.filter((c) =>
        c.participantIds.includes(userId)
      );
    }

    if (IS_HYBRID) {
      const result = await apiCall<ChatConversation[]>(
        'GET',
        `/users/${userId}/conversations`
      );
      if (result.success && result.data) {
        logSource('getChatConversations', 'api');
        return result.data;
      }
      logSource('getChatConversations', 'mock');
      return STATIC_DATA.conversations.filter((c) =>
        c.participantIds.includes(userId)
      );
    }

    // IS_ONLINE
    const result = await apiCall<ChatConversation[]>(
      'GET',
      `/users/${userId}/conversations`
    );
    logSource('getChatConversations', 'api');
    return result.data || [];
  }

  /**
   * Get chat messages in a conversation
   */
  async getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    if (IS_OFFLINE) {
      logSource('getChatMessages', 'mock');
      return STATIC_DATA.messages.filter(
        (m) => m.conversationId === conversationId
      );
    }

    if (IS_HYBRID) {
      const result = await apiCall<ChatMessage[]>(
        'GET',
        `/conversations/${conversationId}/messages`
      );
      if (result.success && result.data) {
        logSource('getChatMessages', 'api');
        return result.data;
      }
      logSource('getChatMessages', 'mock');
      return STATIC_DATA.messages.filter(
        (m) => m.conversationId === conversationId
      );
    }

    // IS_ONLINE
    const result = await apiCall<ChatMessage[]>(
      'GET',
      `/conversations/${conversationId}/messages`
    );
    logSource('getChatMessages', 'api');
    return result.data || [];
  }

  // ========================================================================
  // ADMIN METHODS
  // ========================================================================

  /**
   * Get admin dashboard statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    if (IS_OFFLINE) {
      logSource('getAdminStats', 'mock');
      return STATIC_DATA.adminStats;
    }

    if (IS_HYBRID) {
      const result = await apiCall<AdminStats>('GET', '/admin/stats');
      if (result.success && result.data) {
        logSource('getAdminStats', 'api');
        return result.data;
      }
      logSource('getAdminStats', 'mock');
      return STATIC_DATA.adminStats;
    }

    // IS_ONLINE
    const result = await apiCall<AdminStats>('GET', '/admin/stats');
    logSource('getAdminStats', 'api');
    return result.data || STATIC_DATA.adminStats;
  }

  /**
   * Get admin dashboard with extended data
   */
  async getAdminDashboard(): Promise<any> {
    if (IS_OFFLINE) {
      logSource('getAdminDashboard', 'mock');
      return STATIC_DATA.adminDashboard;
    }

    if (IS_HYBRID) {
      const result = await apiCall<any>('GET', '/admin/dashboard');
      if (result.success && result.data) {
        logSource('getAdminDashboard', 'api');
        return result.data;
      }
      logSource('getAdminDashboard', 'mock');
      return STATIC_DATA.adminDashboard;
    }

    // IS_ONLINE
    const result = await apiCall<any>('GET', '/admin/dashboard');
    logSource('getAdminDashboard', 'api');
    return result.data || STATIC_DATA.adminDashboard;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const dataService = DataService.getInstance();

export default dataService;
