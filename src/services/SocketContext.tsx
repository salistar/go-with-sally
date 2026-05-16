/**
 * ============================================================================
 * GO WITH SALLY - SOCKET CONTEXT
 * ============================================================================
 * Gestion des connexions WebSocket pour le temps réel
 * Supporte 2 modes: OFFLINE (simulation) et ONLINE (socket réel)
 * 
 * Configuration via fichier .env:
 * - SOCKET_URL / EXPO_PUBLIC_SOCKET_URL
 * - OFFLINE_MODE / EXPO_PUBLIC_OFFLINE_MODE
 * 
 * @module contexts/SocketContext
 * @version 2.0.0
 * ============================================================================
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

// Import OFFLINE_MODE depuis api.ts pour garantir la cohérence
import { OFFLINE_MODE } from '../services/api';

// ============================================================================
// CONFIGURATION DEPUIS .ENV
// ============================================================================

/**
 * Récupération des variables d'environnement
 */
const ENV = {
  // URL du Socket
  SOCKET_URL: 
    process.env.EXPO_PUBLIC_SOCKET_URL ||
    process.env.SOCKET_URL ||
    'http://192.168.1.11:5000',
  
  // URL de production
  SOCKET_URL_PROD: 
    process.env.SOCKET_URL_PROD ||
    'https://api.gowithsally.ma',
};

/**
 * URL du WebSocket selon l'environnement
 */
const SOCKET_URL: string = __DEV__ ? ENV.SOCKET_URL : ENV.SOCKET_URL_PROD;

// Logs de configuration au démarrage
console.log('🔌 [SocketContext] ════════════════════════════════════════');
console.log('🔌 [SocketContext] Mode:', OFFLINE_MODE ? '🔴 OFFLINE (Simulation)' : '🟢 ONLINE (Socket)');
console.log('🔌 [SocketContext] Environment:', __DEV__ ? 'Development' : 'Production');
console.log('🔌 [SocketContext] Socket URL:', SOCKET_URL);
console.log('🔌 [SocketContext] ════════════════════════════════════════');

// ============================================================================
// TYPES
// ============================================================================

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// ============================================================================
// MOCK SOCKET POUR MODE OFFLINE
// ============================================================================

class MockSocket {
  private listeners: Map<string, Set<Function>> = new Map();
  public id: string = 'mock_socket_' + Date.now();
  public connected: boolean = true;

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback?: Function) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
    } else {
      this.listeners.delete(event);
    }
  }

  emit(event: string, data?: any) {
    console.log(`🔌 [MockSocket] 📤 Emit: ${event}`, data ? JSON.stringify(data).substring(0, 100) : '');
    
    // Simuler des réponses selon l'événement
    setTimeout(() => {
      this.simulateResponse(event, data);
    }, 500);
  }

  private simulateResponse(event: string, data?: any) {
    switch (event) {
      case 'driver:updateLocation':
        // Pas de réponse nécessaire
        break;
        
      case 'ride:requestNearbyDrivers':
        this.triggerEvent('ride:nearbyDrivers', {
          count: 4,
          drivers: [
            { 
              id: 'd1', 
              name: 'Amina', 
              firstName: 'Amina',
              rating: 4.9, 
              vehicle: { brand: 'Dacia', model: 'Logan', color: 'Blanc' }, 
              distance: 0.8,
              eta: '2 min',
              location: [data?.coordinates?.[0] || -6.8498, data?.coordinates?.[1] || 33.9716],
              latitude: (data?.coordinates?.[1] || 33.9716) + 0.005,
              longitude: (data?.coordinates?.[0] || -6.8498) + 0.003,
            },
            { 
              id: 'd2', 
              name: 'Khadija', 
              firstName: 'Khadija',
              rating: 4.8, 
              vehicle: { brand: 'Peugeot', model: '208', color: 'Gris' }, 
              distance: 1.2,
              eta: '4 min',
              latitude: (data?.coordinates?.[1] || 33.9716) - 0.003,
              longitude: (data?.coordinates?.[0] || -6.8498) - 0.005,
            },
            { 
              id: 'd3', 
              name: 'Sara', 
              firstName: 'Sara',
              rating: 4.7, 
              vehicle: { brand: 'Renault', model: 'Clio', color: 'Noir' }, 
              distance: 2.1,
              eta: '6 min',
              latitude: (data?.coordinates?.[1] || 33.9716) + 0.008,
              longitude: (data?.coordinates?.[0] || -6.8498) - 0.002,
            },
            { 
              id: 'd4', 
              name: 'Fatima', 
              firstName: 'Fatima',
              rating: 4.9, 
              vehicle: { brand: 'Toyota', model: 'Yaris', color: 'Blanc' }, 
              distance: 1.5,
              eta: '3 min',
              latitude: (data?.coordinates?.[1] || 33.9716) - 0.006,
              longitude: (data?.coordinates?.[0] || -6.8498) + 0.007,
            },
          ],
        });
        break;
        
      case 'ride:join':
        console.log(`🔌 [MockSocket] Joined room: ${data}`);
        break;
        
      case 'chat:message':
        // Simuler réponse après 2 secondes
        setTimeout(() => {
          this.triggerEvent('chat:newMessage', {
            senderId: 'driver_001',
            senderName: 'Amina',
            senderType: 'driver',
            message: 'D\'accord, pas de problème!',
            timestamp: new Date().toISOString(),
          });
        }, 2000);
        break;
        
      case 'driver:goOnline':
        this.triggerEvent('driver:statusChanged', { isOnline: true, isAvailable: true });
        break;
        
      case 'driver:goOffline':
        this.triggerEvent('driver:statusChanged', { isOnline: false, isAvailable: false });
        break;
    }
  }

  private triggerEvent(event: string, data: any) {
    console.log(`🔌 [MockSocket] 📥 Received: ${event}`);
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  disconnect() {
    console.log('🔌 [MockSocket] Disconnected');
    this.connected = false;
    this.listeners.get('disconnect')?.forEach(callback => callback('client disconnect'));
  }

  // Méthode pour simuler des événements externes (pour tests)
  simulateIncomingEvent(event: string, data: any) {
    console.log(`🔌 [MockSocket] 🎭 Simulating event: ${event}`);
    this.triggerEvent(event, data);
  }

  // Simuler une demande de course entrante (pour conductrice)
  simulateIncomingRide() {
    setTimeout(() => {
      this.triggerEvent('ride:newRequest', {
        rideId: 'ride_' + Date.now(),
        pickup: { address: 'Morocco Mall', coordinates: [-7.6311, 33.5447] },
        dropoff: { address: 'Twin Center', coordinates: [-7.6192, 33.5883] },
        estimatedFare: 35,
        estimatedDuration: 15,
        passenger: { firstName: 'Fatima', rating: 4.8 },
      });
    }, 5000);
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | MockSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Connexion
  // ─────────────────────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    console.log('🔌 [SocketContext] Tentative de connexion...');

    // MODE OFFLINE - Utiliser MockSocket
    if (OFFLINE_MODE) {
      console.log('🔌 [SocketContext] 🔴 Mode OFFLINE - Création MockSocket');
      const mockSocket = new MockSocket();
      setSocket(mockSocket as any);
      setIsConnected(true);
      
      // Simuler l'événement de connexion
      setTimeout(() => {
        console.log('🔌 [SocketContext] ✅ MockSocket connecté! ID:', mockSocket.id);
      }, 100);
      
      return;
    }

    // MODE ONLINE - Connexion réelle
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        console.log('🔌 [SocketContext] ⚠️ Pas de token, connexion annulée');
        return;
      }

      if ((socket as Socket)?.connected) {
        console.log('🔌 [SocketContext] Déjà connecté');
        return;
      }

      if (socket) {
        (socket as Socket).disconnect();
      }

      console.log('🔌 [SocketContext] 🟢 Mode ONLINE - Connexion à:', SOCKET_URL);

      const newSocket = io(SOCKET_URL, {
        auth: { token: `Bearer ${token}` },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      newSocket.on('connect', () => {
        console.log('🔌 [SocketContext] ✅ Connecté! Socket ID:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 [SocketContext] ❌ Déconnecté. Raison:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.log('🔌 [SocketContext] ❌ Erreur de connexion:', error.message);
        setIsConnected(false);
      });

      newSocket.on('connected', (data) => {
        console.log('🔌 [SocketContext] ✅ Confirmation serveur:', data);
      });

      newSocket.on('error', (error) => {
        console.log('🔌 [SocketContext] ❌ Erreur serveur:', error);
      });

      setSocket(newSocket);

    } catch (error) {
      console.log('🔌 [SocketContext] ❌ Erreur de connexion:', error);
    }
  }, [socket]);

  // ─────────────────────────────────────────────────────────────────────────
  // Déconnexion
  // ─────────────────────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    console.log('🔌 [SocketContext] Déconnexion...');

    if (socket) {
      if (OFFLINE_MODE) {
        (socket as MockSocket).disconnect();
      } else {
        (socket as Socket).disconnect();
      }
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // ─────────────────────────────────────────────────────────────────────────
  // Émettre un événement
  // ─────────────────────────────────────────────────────────────────────────

  const emit = useCallback((event: string, data?: any) => {
    if (socket && isConnected) {
      console.log(`🔌 [SocketContext] 📤 Emit: ${event}`);
      socket.emit(event, data);
    } else {
      console.log(`🔌 [SocketContext] ⚠️ Impossible d'émettre ${event} - Non connecté`);
    }
  }, [socket, isConnected]);

  // ─────────────────────────────────────────────────────────────────────────
  // Écouter un événement
  // ─────────────────────────────────────────────────────────────────────────

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      console.log(`🔌 [SocketContext] 👂 Listening: ${event}`);
      socket.on(event, callback);
    }
  }, [socket]);

  // ─────────────────────────────────────────────────────────────────────────
  // Arrêter d'écouter
  // ─────────────────────────────────────────────────────────────────────────

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      console.log(`🔌 [SocketContext] 🔇 Stop listening: ${event}`);
      socket.off(event, callback);
    }
  }, [socket]);

  // ─────────────────────────────────────────────────────────────────────────
  // Rejoindre/Quitter une room
  // ─────────────────────────────────────────────────────────────────────────

  const joinRoom = useCallback((room: string) => {
    if (socket && isConnected) {
      console.log(`🔌 [SocketContext] 🚪 Joining room: ${room}`);
      socket.emit('ride:join', room);
    }
  }, [socket, isConnected]);

  const leaveRoom = useCallback((room: string) => {
    if (socket && isConnected) {
      console.log(`🔌 [SocketContext] 🚪 Leaving room: ${room}`);
      socket.emit('ride:leave', room);
    }
  }, [socket, isConnected]);

  // ─────────────────────────────────────────────────────────────────────────
  // Gestion AppState
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !isConnected) {
        connect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isConnected, connect]);

  // ─────────────────────────────────────────────────────────────────────────
  // Connexion initiale
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    connect();
    return () => {
      if (socket) {
        if (OFFLINE_MODE) {
          (socket as MockSocket).disconnect();
        } else {
          (socket as Socket).disconnect();
        }
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Valeur du contexte
  // ─────────────────────────────────────────────────────────────────────────

  const value: SocketContextType = {
    socket: socket as Socket,
    isConnected,
    connect,
    disconnect,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// ============================================================================
// EXPORTS
// ============================================================================

// Export de l'URL du Socket pour utilisation externe
export const getSocketUrl = (): string => SOCKET_URL;

export default SocketContext;