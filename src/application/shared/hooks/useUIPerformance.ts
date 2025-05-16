import { useEffect, useRef, useCallback } from 'react';
import UIPerformanceMonitor, { UIPerformanceMetricType } from '@/infrastructure/monitoring/UIPerformanceMonitor';

/**
 * Hook för att mäta UI-prestanda i komponenter
 * 
 * @param componentName - Namnet på komponenten som mäts
 * @param options - Ytterligare alternativ
 * @returns Prestandamätningsfunktioner
 */
export const useUIPerformance = (
  componentName: string,
  options: {
    trackMount?: boolean;
    trackUpdates?: boolean;
    trackUnmount?: boolean;
    componentId?: string;
  } = {}
) => {
  const {
    trackMount = true,
    trackUpdates = false,
    trackUnmount = true,
    componentId = undefined
  } = options;
  
  const performanceMonitor = UIPerformanceMonitor.getInstance();
  const uniqueId = useRef<string>(`${componentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const renderOpIdRef = useRef<string | null>(null);
  const updateCountRef = useRef<number>(0);
  
  // Spåra montering
  useEffect(() => {
    if (trackMount) {
      const mountOpId = performanceMonitor.startComponentRender(
        componentName,
        componentId || uniqueId.current
      );
      
      return () => {
        if (mountOpId) {
          performanceMonitor.endComponentRender(null, mountOpId);
        }
        
        // Spåra avmontering
        if (trackUnmount) {
          const unmountOpId = performanceMonitor.startComponentRender(
            `${componentName}_unmount`,
            componentId || uniqueId.current
          );
          
          if (unmountOpId) {
            setTimeout(() => {
              performanceMonitor.endComponentRender(null, unmountOpId);
            }, 0);
          }
        }
      };
    }
    
    return undefined;
  }, []); // Körs endast vid montering/avmontering
  
  // Spåra uppdateringar
  useEffect(() => {
    // Hoppa över första renderingen (montering)
    if (trackUpdates && updateCountRef.current > 0) {
      const updateOpId = performanceMonitor.startComponentRender(
        `${componentName}_update_${updateCountRef.current}`,
        componentId || uniqueId.current
      );
      
      if (updateOpId) {
        setTimeout(() => {
          performanceMonitor.endComponentRender(null, updateOpId);
        }, 0);
      }
    }
    
    updateCountRef.current += 1;
  }); // Körs vid varje rendering
  
  /**
   * Starta mätning av render
   */
  const startRender = useCallback(() => {
    renderOpIdRef.current = performanceMonitor.startComponentRender(
      componentName,
      componentId || uniqueId.current
    );
    
    return renderOpIdRef.current;
  }, [componentName, componentId]);
  
  /**
   * Avsluta mätning av render
   */
  const endRender = useCallback((opId?: string | null) => {
    const id = opId || renderOpIdRef.current;
    if (id) {
      performanceMonitor.endComponentRender(null, id);
      if (id === renderOpIdRef.current) {
        renderOpIdRef.current = null;
      }
    }
  }, []);
  
  /**
   * Mät renderingstid för en funktion
   */
  const measureRender = useCallback(<T>(renderFunc: () => T): T => {
    return performanceMonitor.measureComponentRender(
      componentName,
      renderFunc,
      componentId || uniqueId.current
    );
  }, [componentName, componentId]);
  
  /**
   * Mät en användarinteraktion
   */
  const measureInteraction = useCallback(<T>(
    interactionName: string,
    interactionFunc: () => Promise<T>
  ): Promise<T> => {
    return performanceMonitor.measureInteraction(
      `${componentName}_${interactionName}`,
      interactionFunc
    );
  }, [componentName]);
  
  /**
   * Mät prestanda för en lista
   */
  const measureList = useCallback((
    listName: string,
    itemCount: number,
    renderFunc: () => void
  ) => {
    const listOpId = performanceMonitor.measureListRendering(
      `${componentName}_${listName}`,
      itemCount
    );
    
    try {
      renderFunc();
    } finally {
      if (listOpId) {
        performanceMonitor.endListRendering(listOpId);
      }
    }
  }, [componentName]);
  
  return {
    startRender,
    endRender,
    measureRender,
    measureInteraction,
    measureList,
    uniqueId: uniqueId.current
  };
};

export default useUIPerformance; 