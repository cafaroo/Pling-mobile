import React, { createContext, useContext, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { EventBus } from '@/shared/core/EventBus';
import { InfrastructureFactory } from './InfrastructureFactory';
import { OptimizedUserRepository } from './supabase/repositories/OptimizedUserRepository';
import { CacheService } from './cache/CacheService';
import { LoggingService } from './logger/LoggingService';
import { PerformanceMonitor } from './monitoring/PerformanceMonitor';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { SupabaseTeamRepository } from './supabase/repositories/SupabaseTeamRepository';

interface InfrastructureContextType {
  factory: InfrastructureFactory;
  userRepository: OptimizedUserRepository;
  teamRepository: TeamRepository;
  teamActivityRepository: TeamActivityRepository;
  cacheService: CacheService;
  logger: LoggingService;
  performanceMonitor: PerformanceMonitor;
}

const InfrastructureContext = createContext<InfrastructureContextType | null>(null);

interface InfrastructureProviderProps {
  children: ReactNode;
  supabase: SupabaseClient;
  eventBus: EventBus;
}

export const InfrastructureProvider: React.FC<InfrastructureProviderProps> = ({
  children,
  supabase,
  eventBus,
}) => {
  // Skapa och konfigurera factory
  const factory = InfrastructureFactory.getInstance(supabase, eventBus, {
    enableLogging: true,
    enablePerformanceMonitoring: true,
    cacheTtl: 5 * 60 * 1000, // 5 minuter standardlivslängd för cache
    cacheVersion: '1.0.0',
  });

  // Hämta repositories och tjänster
  const userRepository = factory.getUserRepository();
  const teamActivityRepository = factory.getTeamActivityRepository();
  const cacheService = factory.getCacheService();
  const logger = factory.getLogger();
  const performanceMonitor = factory.getPerformanceMonitor();
  
  // Skapa team repository
  const teamRepository = new SupabaseTeamRepository(supabase, eventBus);

  const value: InfrastructureContextType = {
    factory,
    userRepository,
    teamRepository,
    teamActivityRepository,
    cacheService,
    logger,
    performanceMonitor
  };

  return (
    <InfrastructureContext.Provider value={value}>
      {children}
    </InfrastructureContext.Provider>
  );
};

export const useInfrastructure = (): InfrastructureContextType => {
  const context = useContext(InfrastructureContext);
  if (!context) {
    throw new Error('useInfrastructure måste användas inom en InfrastructureProvider');
  }
  return context;
}; 