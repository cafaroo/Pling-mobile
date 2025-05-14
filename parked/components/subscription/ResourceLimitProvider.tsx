import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { supabase } from '@/lib/supabase';
import { ResourceCacheManager } from '@/services/ResourceCacheManager';

// Resurstyper som stöds i systemet
export enum ResourceType {
  TEAM = 'team',
  TEAM_MEMBER = 'team_member',
  GOAL = 'goal',
  COMPETITION = 'competition',
  REPORT = 'report',
  DASHBOARD = 'dashboard',
  MEDIA_STORAGE = 'media_storage',
}

// Struktur för resursbegränsning
export interface ResourceLimit {
  resourceType: ResourceType;
  limitValue: number;
  currentUsage: number;
  displayName: string;
  description?: string;
}

// Kontext för resursbegränsningar
interface ResourceLimitContextType {
  limits: ResourceLimit[];
  isLoading: boolean;
  error: Error | null;
  checkResourceLimit: (resourceType: ResourceType, increment?: number) => boolean;
  refreshLimits: () => Promise<void>;
  invalidateCache: (resourceType?: ResourceType) => void;
}

const ResourceLimitContext = createContext<ResourceLimitContextType | undefined>(undefined);

export const useResourceLimits = () => {
  const context = useContext(ResourceLimitContext);
  if (!context) {
    throw new Error('useResourceLimits måste användas inom en ResourceLimitProvider');
  }
  return context;
};

export const ResourceLimitProvider: React.FC<PropsWithChildren<{
  organizationId: string;
}>> = ({ organizationId, children }) => {
  const [limits, setLimits] = useState<ResourceLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheManager = ResourceCacheManager.getInstance();

  const loadResourceLimits = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      
      // Försök hämta från cache först om inte forceRefresh är true
      if (!forceRefresh) {
        const cachedLimits = cacheManager.getCachedResourceLimits(organizationId);
        if (cachedLimits) {
          setLimits(cachedLimits);
          setIsLoading(false);
          return;
        }
      }
      
      // Cache saknas eller force refresh, hämta från databasen
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('organization_id', organizationId)
        .single();
      
      if (subError) throw subError;
      
      // Optimera genom att använda RPC istället för flera separata frågor
      const { data, error: rpcError } = await supabase.rpc(
        'get_organization_resource_limits',
        { p_organization_id: organizationId, p_plan_id: subscription.plan_id }
      );
      
      if (rpcError) {
        // Fallback till äldre implementering om RPC misslyckas
        // Hämta resursbegränsningar baserat på plan
        const { data: resourceLimits, error: limitsError } = await supabase
          .from('resource_limits')
          .select('*')
          .eq('plan_type', subscription.plan_id);
        
        if (limitsError) throw limitsError;
        
        // Hämta aktuell användning
        const { data: resourceUsage, error: usageError } = await supabase
          .from('resource_usage')
          .select('*')
          .eq('organization_id', organizationId);
        
        if (usageError) throw usageError;
        
        // Kombinera begränsningar med användning
        const combinedLimits = resourceLimits.map(limit => {
          const usage = resourceUsage.find(u => u.resource_type === limit.resource_type);
          return {
            resourceType: limit.resource_type,
            limitValue: limit.limit_value,
            currentUsage: usage ? usage.current_usage : 0,
            displayName: limit.display_name,
            description: limit.description
          } as ResourceLimit;
        });
        
        setLimits(combinedLimits);
        
        // Spara i cache för framtida användning
        cacheManager.cacheResourceLimits(organizationId, combinedLimits);
      } else {
        // Transformera RPC-resultat till ResourceLimit[]
        const formattedLimits = data.map((item: any) => ({
          resourceType: item.resource_type,
          limitValue: item.limit_value,
          currentUsage: item.current_usage || 0,
          displayName: item.display_name,
          description: item.description
        } as ResourceLimit));
        
        setLimits(formattedLimits);
        
        // Spara i cache för framtida användning
        cacheManager.cacheResourceLimits(organizationId, formattedLimits);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ett fel uppstod vid laddning av resursbegränsningar'));
    } finally {
      setIsLoading(false);
    }
  };

  // Kontrollera om en resursanvändning skulle överskrida gränsen
  const checkResourceLimit = (resourceType: ResourceType, increment: number = 1): boolean => {
    if (isLoading) return false;
    
    // Försök använda cachad specifik resursbegränsning för bättre prestanda
    const cachedLimit = cacheManager.getCachedResourceLimit(resourceType, organizationId);
    if (cachedLimit) {
      return (cachedLimit.currentUsage + increment) <= cachedLimit.limitValue;
    }
    
    // Fallback till lista i state
    const limit = limits.find(l => l.resourceType === resourceType);
    if (!limit) return true; // Om ingen begränsning finns, tillåt
    
    return (limit.currentUsage + increment) <= limit.limitValue;
  };

  // Ladda begränsningar när providern monteras eller organizationId ändras
  useEffect(() => {
    if (organizationId) {
      loadResourceLimits();
    }
  }, [organizationId]);

  // Exponera uppdateringsfunktion
  const refreshLimits = async () => {
    await loadResourceLimits(true); // Force refresh
  };
  
  // Funktion för att invalidera cache
  const invalidateCache = (resourceType?: ResourceType) => {
    if (resourceType) {
      cacheManager.clearForResourceType(resourceType, organizationId);
    } else {
      cacheManager.clearForOrganization(organizationId);
    }
  };

  return (
    <ResourceLimitContext.Provider 
      value={{ 
        limits, 
        isLoading, 
        error, 
        checkResourceLimit,
        refreshLimits,
        invalidateCache
      }}
    >
      {children}
    </ResourceLimitContext.Provider>
  );
}; 