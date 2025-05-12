import React, { useEffect, useCallback } from 'react';
import { useUsageTracking } from '../../hooks/useUsageTracking';

interface ResourceUsageTrackerProps {
  /**
   * Nuvarande antal teammedlemmar, om inte angivet spåras inte detta
   */
  teamMembersCount?: number;
  
  /**
   * Nuvarande medialagring i MB, om inte angivet spåras inte detta
   */
  mediaStorageMB?: number;
  
  /**
   * Nuvarande antal dashboards, om inte angivet spåras inte detta
   */
  dashboardsCount?: number;
  
  /**
   * Intervall i millisekunder mellan uppdateringar (default: 3600000 ms = 1 timme)
   */
  updateInterval?: number;
  
  /**
   * Skicka uppdatering direkt vid montering
   */
  updateOnMount?: boolean;
}

/**
 * Komponent som spårar resursanvändning och rapporterar den till
 * UsageTrackingService. Detta är en osynlig komponent som endast
 * implementerar logik för att spåra resurser.
 */
export const ResourceUsageTracker: React.FC<ResourceUsageTrackerProps> = ({
  teamMembersCount,
  mediaStorageMB,
  dashboardsCount,
  updateInterval = 3600000, // 1 timme
  updateOnMount = true,
}) => {
  const {
    updateTeamMembersCount,
    updateMediaStorage,
    updateCustomDashboardsCount,
  } = useUsageTracking();
  
  // Funktion för att uppdatera alla resurser
  const updateAllResources = useCallback(() => {
    // Endast uppdatera de resurser som har angivits
    if (teamMembersCount !== undefined) {
      updateTeamMembersCount(teamMembersCount);
    }
    
    if (mediaStorageMB !== undefined) {
      updateMediaStorage(mediaStorageMB);
    }
    
    if (dashboardsCount !== undefined) {
      updateCustomDashboardsCount(dashboardsCount);
    }
  }, [
    teamMembersCount,
    mediaStorageMB,
    dashboardsCount,
    updateTeamMembersCount,
    updateMediaStorage,
    updateCustomDashboardsCount,
  ]);
  
  // Uppdatera resurser vid montering
  useEffect(() => {
    if (updateOnMount) {
      updateAllResources();
    }
  }, [updateOnMount, updateAllResources]);
  
  // Uppdatera resurser periodiskt
  useEffect(() => {
    if (updateInterval <= 0) return;
    
    const interval = setInterval(() => {
      updateAllResources();
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [updateInterval, updateAllResources]);
  
  // Uppdatera resurser när värden ändras
  useEffect(() => {
    // Endast uppdatera om åtminstone någon resurs är angiven
    if (
      teamMembersCount !== undefined ||
      mediaStorageMB !== undefined ||
      dashboardsCount !== undefined
    ) {
      updateAllResources();
    }
  }, [teamMembersCount, mediaStorageMB, dashboardsCount, updateAllResources]);
  
  // Renderar ingenting, bara logik
  return null;
}; 