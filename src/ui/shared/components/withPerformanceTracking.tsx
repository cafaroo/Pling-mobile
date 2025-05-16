import React, { useEffect, useRef } from 'react';
import UIPerformanceMonitor from '@/infrastructure/monitoring/UIPerformanceMonitor';
import { useUIPerformance } from '@/application/shared/hooks/useUIPerformance';

/**
 * Higher-Order Component (HOC) för att mäta prestanda för komponenter
 * 
 * @param Component - Komponenten som ska mätas
 * @param options - Prestandamätningsalternativ
 * @returns En ny komponent med prestandamätning
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    componentName?: string;
    trackMount?: boolean;
    trackUpdates?: boolean;
    trackUnmount?: boolean;
    trackRender?: boolean;
  } = {}
) {
  const {
    componentName = Component.displayName || Component.name || 'UnknownComponent',
    trackMount = true,
    trackUpdates = true,
    trackUnmount = true,
    trackRender = true
  } = options;
  
  // Funktionsnamn för komponenten
  const wrappedComponentName = `WithPerformanceTracking(${componentName})`;
  
  // Skapa den wrappade komponenten
  const WrappedComponent = (props: P) => {
    const { 
      startRender, 
      endRender, 
      uniqueId 
    } = useUIPerformance(componentName, {
      trackMount,
      trackUpdates,
      trackUnmount
    });
    
    // Spåra render-prestanda med manuell timing om trackRender är aktiverat
    useEffect(() => {
      if (trackRender) {
        const opId = startRender();
        
        // Cleanup efter att komponenten har renderats
        return () => {
          endRender(opId);
        };
      }
      
      return undefined;
    }, [props]); // Körs varje gång props ändras
    
    // Rendera den ursprungliga komponenten med samma props
    return <Component {...props} />;
  };
  
  // Sätt displayName för bättre debugging
  WrappedComponent.displayName = wrappedComponentName;
  
  return WrappedComponent;
}

/**
 * Factory-funktion för att skapa en anpassad HOC med fördefinierade alternativ
 */
export function createPerformanceTracker(defaultOptions: {
  trackMount?: boolean;
  trackUpdates?: boolean;
  trackUnmount?: boolean;
  trackRender?: boolean;
} = {}) {
  return function trackPerformance<P extends object>(
    Component: React.ComponentType<P>,
    options: {
      componentName?: string;
      trackMount?: boolean;
      trackUpdates?: boolean;
      trackUnmount?: boolean;
      trackRender?: boolean;
    } = {}
  ) {
    return withPerformanceTracking(Component, {
      ...defaultOptions,
      ...options
    });
  };
}

export default withPerformanceTracking; 