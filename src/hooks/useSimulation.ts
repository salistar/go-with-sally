/**
 * GO WITH SALLY - USE SIMULATION HOOK
 * Hook pour la gestion de la simulation
 */

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { simulationService, SimulatedRideRequest, SimulationState } from '../services/simulationService';
import { APP_MODE } from '../constants/appMode';
import { ServiceType } from '../types/services.types';

interface UseSimulationReturn {
  isSimulationAvailable: boolean;
  isSimulating: boolean;
  simulationState: SimulationState;
  startSimulation: (request: SimulatedRideRequest) => void;
  stopSimulation: () => void;
  startTrip: (rideId: string, destination: { latitude: number; longitude: number }) => void;
  simulateCancel: (rideId: string) => void;
  getAvailableDrivers: (serviceType?: ServiceType) => any[];
}

export function useSimulation(): UseSimulationReturn {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState>(simulationService.getState());
  
  const { preferredLanguage } = useSelector((state: RootState) => state.settings);

  useEffect(() => {
    simulationService.configure(APP_MODE, preferredLanguage as 'fr' | 'ar' | 'en');
  }, [preferredLanguage]);

  useEffect(() => {
    const handleDriverFound = (driver: any) => {
      setSimulationState(simulationService.getState());
    };

    const handleRideStatusChanged = (data: any) => {
      setSimulationState(simulationService.getState());
      if (data.status === 'completed' || data.status === 'cancelled') {
        setIsSimulating(false);
      }
    };

    const handleDriverLocationUpdated = (location: any) => {
      // Géré par le store Redux
    };

    const handleNewMessage = (message: any) => {
      // Géré par le store Redux
    };

    simulationService.on('driverFound', handleDriverFound);
    simulationService.on('rideStatusChanged', handleRideStatusChanged);
    simulationService.on('driverLocationUpdated', handleDriverLocationUpdated);
    simulationService.on('newMessage', handleNewMessage);

    return () => {
      // Cleanup si nécessaire
    };
  }, []);

  const startSimulation = useCallback((request: SimulatedRideRequest) => {
    setIsSimulating(true);
    simulationService.startRideSimulation(request);
    setSimulationState(simulationService.getState());
  }, []);

  const stopSimulation = useCallback(() => {
    simulationService.stopSimulation();
    setIsSimulating(false);
    setSimulationState(simulationService.getState());
  }, []);

  const startTrip = useCallback((rideId: string, destination: { latitude: number; longitude: number }) => {
    simulationService.startTripSimulation(rideId, destination);
    setSimulationState(simulationService.getState());
  }, []);

  const simulateCancel = useCallback((rideId: string) => {
    simulationService.simulateDriverCancel(rideId);
    setIsSimulating(false);
    setSimulationState(simulationService.getState());
  }, []);

  const getAvailableDrivers = useCallback((serviceType?: ServiceType) => {
    return simulationService.getAvailableDrivers(serviceType);
  }, []);

  return {
    isSimulationAvailable: simulationService.isAvailable(APP_MODE),
    isSimulating,
    simulationState,
    startSimulation,
    stopSimulation,
    startTrip,
    simulateCancel,
    getAvailableDrivers,
  };
}

export default useSimulation;