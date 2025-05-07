import { useContext } from 'react';
import { supabase } from '@/infrastructure/supabase';
import { getEventBus } from '@/shared/core/EventBus';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';
import { LogLevel } from '@/infrastructure/logger/LoggingService';

/**
 * Hook för att hämta optimerade användar-beroenden med cachning, loggning och prestanda-övervakning
 */
export const useOptimizedUserDependencies = () => {
  // Skapa och konfigurera infrastruktur
  const infrastructureFactory = InfrastructureFactory.getInstance(
    supabase,
    getEventBus(),
    {
      // Loggning
      enableLogging: true,
      logLevel: LogLevel.INFO,
      enableRemoteLogging: false,  // Aktivera vid behov
      
      // Prestanda
      enablePerformanceMonitoring: true,
      slowOperationThreshold: 500, // 500ms anses långsamt
      performanceReportInterval: 60000, // Rapportera varje minut
      
      // Cachning
      cacheTtl: 15 * 60 * 1000, // 15 minuters cache
      cacheVersion: '1.0',
      enableCacheDebug: false
    }
  );
  
  // Hämta optimerat användarrepository
  const userRepository = infrastructureFactory.getUserRepository();
  const logger = infrastructureFactory.getLogger();
  const performanceMonitor = infrastructureFactory.getPerformanceMonitor();
  
  return {
    userRepository,
    logger,
    performanceMonitor
  };
}; 