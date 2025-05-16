import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import UIPerformanceMonitor, { UIPerformanceMonitorOptions } from '@/infrastructure/monitoring/UIPerformanceMonitor';
import { PerformanceMeasurement, OperationType } from '@/infrastructure/monitoring/PerformanceMonitor';

interface PerformanceContextType {
  isMonitoringEnabled: boolean;
  toggleMonitoring: (enabled: boolean) => void;
  measurements: PerformanceMeasurement[];
  getMeasurements: () => PerformanceMeasurement[];
  clearMeasurements: () => void;
  updateOptions: (options: Partial<UIPerformanceMonitorOptions>) => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export interface PerformanceMonitorProviderProps {
  children: ReactNode;
  initialOptions?: UIPerformanceMonitorOptions;
  autoStartMonitoring?: boolean;
}

/**
 * Provider för prestationsmätning
 */
export const PerformanceMonitorProvider: React.FC<PerformanceMonitorProviderProps> = ({
  children,
  initialOptions,
  autoStartMonitoring = true,
}) => {
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState<boolean>(autoStartMonitoring);
  const [measurements, setMeasurements] = useState<PerformanceMeasurement[]>([]);
  
  // Initiera UIPerformanceMonitor med initiala alternativ
  useEffect(() => {
    const monitor = UIPerformanceMonitor.getInstance({
      enabled: autoStartMonitoring,
      ...initialOptions,
    });
    
    // Uppdatera mätningar var 10:e sekund under aktiv användning
    const intervalId = setInterval(() => {
      if (isMonitoringEnabled) {
        setMeasurements(monitor.getUIMeasurements());
      }
    }, 10000);
    
    // Hantera app-livscykeln
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Återuppta mätningar när appen återgår till förgrunden
        if (isMonitoringEnabled) {
          monitor.updateOptions({ enabled: true });
        }
      } else if (nextAppState === 'background') {
        // Spara eventuella mätningar när appen går i bakgrunden
        setMeasurements(monitor.getUIMeasurements());
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [autoStartMonitoring, initialOptions, isMonitoringEnabled]);
  
  /**
   * Slå på/av prestandamätning
   */
  const toggleMonitoring = (enabled: boolean) => {
    const monitor = UIPerformanceMonitor.getInstance();
    monitor.updateOptions({ enabled });
    setIsMonitoringEnabled(enabled);
    
    if (!enabled) {
      // Om övervakning stängs av, hämta de sista mätningarna
      setMeasurements(monitor.getUIMeasurements());
    }
  };
  
  /**
   * Hämta alla mätningar
   */
  const getMeasurements = () => {
    const monitor = UIPerformanceMonitor.getInstance();
    const latestMeasurements = monitor.getUIMeasurements();
    setMeasurements(latestMeasurements);
    return latestMeasurements;
  };
  
  /**
   * Rensa alla mätningar
   */
  const clearMeasurements = () => {
    const monitor = UIPerformanceMonitor.getInstance();
    const performanceMonitor = monitor['performanceMonitor'];
    if (performanceMonitor && typeof performanceMonitor.clearMeasurements === 'function') {
      performanceMonitor.clearMeasurements();
    }
    setMeasurements([]);
  };
  
  /**
   * Uppdatera konfigurationsalternativ
   */
  const updateOptions = (options: Partial<UIPerformanceMonitorOptions>) => {
    const monitor = UIPerformanceMonitor.getInstance();
    monitor.updateOptions(options);
    
    if (options.enabled !== undefined) {
      setIsMonitoringEnabled(options.enabled);
    }
  };
  
  const value = {
    isMonitoringEnabled,
    toggleMonitoring,
    measurements,
    getMeasurements,
    clearMeasurements,
    updateOptions,
  };
  
  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

/**
 * Hook för att använda PerformanceContext
 */
export const usePerformanceMonitor = () => {
  const context = useContext(PerformanceContext);
  
  if (context === undefined) {
    throw new Error('usePerformanceMonitor måste användas inom en PerformanceMonitorProvider');
  }
  
  return context;
};

export default PerformanceMonitorProvider;