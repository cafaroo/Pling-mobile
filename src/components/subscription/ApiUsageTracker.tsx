import React, { useEffect, useRef } from 'react';
import { useUsageTracking } from '../../hooks/useUsageTracking';

/**
 * Gränssnitt för HttpRequest-objekt som ska spåras.
 */
type TrackedHttpRequest = {
  url: string;
  method: string;
  timestamp: number;
};

/**
 * Props för ApiUsageTracker-komponenten.
 */
interface ApiUsageTrackerProps {
  /**
   * Valfri lista över API-URLs att exkludera från spårning.
   */
  excludeUrls?: string[];
  
  /**
   * Valfri lista över HTTP-metoder att spåra (default: alla).
   */
  trackMethods?: string[];
  
  /**
   * Intervall i millisekunder mellan rapporteringar (default: 60000 ms = 1 minut).
   */
  reportingInterval?: number;
  
  /**
   * Om true, spårar alla fetch-anrop i applikationen (default: true).
   */
  trackFetch?: boolean;
  
  /**
   * Om true, spårar alla XMLHttpRequest i applikationen (default: true).
   */
  trackXhr?: boolean;
}

/**
 * Komponent som spårar API-användning och rapporterar den till
 * UsageTrackingService. Detta är en osynlig komponent som endast
 * implementerar logik för att spåra API-anrop.
 */
export const ApiUsageTracker: React.FC<ApiUsageTrackerProps> = ({
  excludeUrls = [],
  trackMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  reportingInterval = 60000, // 1 minut
  trackFetch = true,
  trackXhr = true,
}) => {
  const { incrementApiRequestCount } = useUsageTracking();
  const trackedRequestsRef = useRef<TrackedHttpRequest[]>([]);
  
  // Monkeypatcha fetch API för att spåra anrop
  useEffect(() => {
    if (!trackFetch) return;
    
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      const method = init?.method || 'GET';
      
      // Kontrollera om URL är exkluderad
      if (!shouldTrackRequest(url, method)) {
        return originalFetch(input, init);
      }
      
      // Spåra anropet
      trackRequest(url, method);
      
      try {
        return await originalFetch(input, init);
      } catch (error) {
        // Räkna även misslyckade anrop
        throw error;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [trackFetch, excludeUrls, trackMethods]);
  
  // Monkeypatcha XMLHttpRequest för att spåra anrop
  useEffect(() => {
    if (!trackXhr) return;
    
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string) {
      // Spara information för senare användning i send-metoden
      this._trackedMethod = method;
      this._trackedUrl = url;
      originalOpen.apply(this, arguments as any);
    };
    
    XMLHttpRequest.prototype.send = function() {
      const method = this._trackedMethod || 'GET';
      const url = this._trackedUrl || '';
      
      // Kontrollera om URL är exkluderad
      if (shouldTrackRequest(url, method)) {
        trackRequest(url, method);
      }
      
      originalSend.apply(this, arguments as any);
    };
    
    return () => {
      XMLHttpRequest.prototype.open = originalOpen;
      XMLHttpRequest.prototype.send = originalSend;
    };
  }, [trackXhr, excludeUrls, trackMethods]);
  
  // Rapportera användning periodiskt
  useEffect(() => {
    const reportInterval = setInterval(() => {
      reportTrackedRequests();
    }, reportingInterval);
    
    return () => clearInterval(reportInterval);
  }, [reportingInterval]);
  
  // Rapportera användning när komponenten avmonteras
  useEffect(() => {
    return () => {
      reportTrackedRequests();
    };
  }, []);
  
  /**
   * Kontrollerar om ett API-anrop ska spåras.
   */
  const shouldTrackRequest = (url: string, method: string): boolean => {
    // Kontrollera om URL är i exclusion-listan
    const isExcluded = excludeUrls.some(excludeUrl => url.includes(excludeUrl));
    if (isExcluded) return false;
    
    // Kontrollera om metoden är i trackMethods-listan
    const methodToCheck = method.toUpperCase();
    return trackMethods.includes(methodToCheck);
  };
  
  /**
   * Lägger till ett spårat anrop i listan.
   */
  const trackRequest = (url: string, method: string): void => {
    trackedRequestsRef.current.push({
      url,
      method,
      timestamp: Date.now(),
    });
  };
  
  /**
   * Rapporterar spårade anrop till UsageTrackingService.
   */
  const reportTrackedRequests = (): void => {
    const count = trackedRequestsRef.current.length;
    
    if (count > 0) {
      incrementApiRequestCount(count);
      trackedRequestsRef.current = [];
    }
  };
  
  // Renderar ingenting, bara logik
  return null;
}; 