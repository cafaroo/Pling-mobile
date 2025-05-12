import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { ResourceType } from '@/domain/organization/strategies/ResourceLimitStrategy';

// Typer för resursbegränsningar
export type SubscriptionPlanType = 'basic' | 'pro' | 'enterprise';

// Interface för en resursbegränsning
export interface ResourceLimit {
  id: string;
  planType: SubscriptionPlanType;
  resourceType: ResourceType;
  limitValue: number;
  displayName: string;
  description?: string;
}

// Interface för resursanvändning
export interface ResourceUsage {
  resourceType: ResourceType;
  currentUsage: number;
  limit: number;
  usagePercentage: number;
  limitReached: boolean;
  nearLimit: boolean; // 80% eller mer
}

// Kontext-interface
interface ResourceLimitContextProps {
  // Resursbegränsningar
  limits: ResourceLimit[];
  organizationPlan: SubscriptionPlanType;
  isLoading: boolean;
  error: Error | null;
  
  // Resursanvändning
  usage: ResourceUsage[];
  
  // Hjälpfunktioner
  getLimit: (resourceType: ResourceType) => number;
  getUsage: (resourceType: ResourceType) => ResourceUsage | null;
  getUsagePercentage: (resourceType: ResourceType) => number;
  isLimitReached: (resourceType: ResourceType) => boolean;
  isNearLimit: (resourceType: ResourceType) => boolean;
  refreshUsage: () => Promise<void>;
}

// Skapa kontext
const ResourceLimitContext = createContext<ResourceLimitContextProps | undefined>(undefined);

// Interface för provider-props
interface ResourceLimitProviderProps {
  organizationId: string;
  children: ReactNode;
}

/**
 * Provider för resursbegränsningsinformation.
 * Hämtar resursbegränsningar baserat på organisationens prenumerationsplan
 * och organisationens aktuella resursanvändning.
 */
export const ResourceLimitProvider: React.FC<ResourceLimitProviderProps> = ({ 
  organizationId, 
  children 
}) => {
  const [limits, setLimits] = useState<ResourceLimit[]>([]);
  const [organizationPlan, setOrganizationPlan] = useState<SubscriptionPlanType>('basic');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [usage, setUsage] = useState<ResourceUsage[]>([]);

  // Funktion för att hämta organisationens prenumerationsplan
  const fetchOrganizationPlan = async () => {
    try {
      // Hämta prenumerationen
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;

      if (subscription) {
        // Hämta planens detaljer
        const { data: plan, error: planError } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', subscription.plan_id)
          .maybeSingle();

        if (planError) throw planError;

        if (plan && (plan.name === 'basic' || plan.name === 'pro' || plan.name === 'enterprise')) {
          setOrganizationPlan(plan.name as SubscriptionPlanType);
        }
      }
    } catch (error) {
      console.error('Fel vid hämtning av prenumerationsplan:', error);
      setError(error instanceof Error ? error : new Error('Ett okänt fel inträffade'));
    }
  };

  // Funktion för att hämta resursbegränsningar
  const fetchResourceLimits = async () => {
    try {
      // Hämta alla begränsningar först
      const { data, error } = await supabase
        .from('resource_limits')
        .select('*')
        .order('resource_type', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedLimits = data.map(item => ({
          id: item.id,
          planType: item.plan_type as SubscriptionPlanType,
          resourceType: item.resource_type as ResourceType,
          limitValue: item.limit_value,
          displayName: item.display_name,
          description: item.description
        }));

        setLimits(mappedLimits);
      }
    } catch (error) {
      console.error('Fel vid hämtning av resursbegränsningar:', error);
      setError(error instanceof Error ? error : new Error('Ett okänt fel inträffade'));
    }
  };

  // Funktion för att hämta resursanvändning
  const fetchResourceUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_usage')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;

      if (data) {
        const currentUsageMap = data.reduce((acc, item) => {
          acc[item.resource_type] = item.current_usage;
          return acc;
        }, {} as Record<string, number>);

        // Skapa usage-objekt för alla resurser som har begränsningar för aktuell plan
        const relevantLimits = limits.filter(limit => limit.planType === organizationPlan);
        const currentUsage: ResourceUsage[] = relevantLimits.map(limit => {
          const usage = currentUsageMap[limit.resourceType] || 0;
          const usagePercentage = Math.round((usage / limit.limitValue) * 100);
          
          return {
            resourceType: limit.resourceType,
            currentUsage: usage,
            limit: limit.limitValue,
            usagePercentage: usagePercentage,
            limitReached: usage >= limit.limitValue,
            nearLimit: usagePercentage >= 80 && usagePercentage < 100
          };
        });

        setUsage(currentUsage);
      }
    } catch (error) {
      console.error('Fel vid hämtning av resursanvändning:', error);
      setError(error instanceof Error ? error : new Error('Ett okänt fel inträffade'));
    }
  };

  // Funktion för att uppdatera resursanvändning
  const refreshUsage = async () => {
    await fetchResourceUsage();
  };

  // Hjälpfunktion för att hämta begränsning för en viss resurstyp
  const getLimit = (resourceType: ResourceType): number => {
    const limit = limits.find(l => 
      l.planType === organizationPlan && l.resourceType === resourceType
    );
    return limit ? limit.limitValue : 0;
  };

  // Hjälpfunktion för att hämta användningen för en viss resurstyp
  const getUsage = (resourceType: ResourceType): ResourceUsage | null => {
    return usage.find(u => u.resourceType === resourceType) || null;
  };

  // Hjälpfunktion för att hämta användningsprocent för en viss resurstyp
  const getUsagePercentage = (resourceType: ResourceType): number => {
    const resourceUsage = getUsage(resourceType);
    return resourceUsage ? resourceUsage.usagePercentage : 0;
  };

  // Hjälpfunktion för att kontrollera om begränsningen är nådd
  const isLimitReached = (resourceType: ResourceType): boolean => {
    const resourceUsage = getUsage(resourceType);
    return resourceUsage ? resourceUsage.limitReached : false;
  };

  // Hjälpfunktion för att kontrollera om användningen är nära begränsningen
  const isNearLimit = (resourceType: ResourceType): boolean => {
    const resourceUsage = getUsage(resourceType);
    return resourceUsage ? resourceUsage.nearLimit : false;
  };

  // Hämta data vid initialisering
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchOrganizationPlan();
        await fetchResourceLimits();
      } catch (error) {
        console.error('Fel vid laddning av resursbegränsningsdata:', error);
        setError(error instanceof Error ? error : new Error('Ett okänt fel inträffade'));
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId) {
      loadData();
    }
  }, [organizationId]);

  // Hämta användning när begränsningar och plan är laddade
  useEffect(() => {
    if (limits.length > 0 && organizationPlan && !isLoading) {
      fetchResourceUsage();
    }
  }, [limits, organizationPlan, isLoading]);

  // Kontext-värde
  const value: ResourceLimitContextProps = {
    limits,
    organizationPlan,
    isLoading,
    error,
    usage,
    getLimit,
    getUsage,
    getUsagePercentage,
    isLimitReached,
    isNearLimit,
    refreshUsage
  };

  return (
    <ResourceLimitContext.Provider value={value}>
      {children}
    </ResourceLimitContext.Provider>
  );
};

/**
 * Hook för att använda resursbegränsningskontext.
 */
export const useResourceLimits = () => {
  const context = useContext(ResourceLimitContext);
  if (context === undefined) {
    throw new Error('useResourceLimits måste användas inom en ResourceLimitProvider');
  }
  return context;
}; 