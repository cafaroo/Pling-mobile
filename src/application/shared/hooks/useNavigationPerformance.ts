import { useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import UIPerformanceMonitor from '@/infrastructure/monitoring/UIPerformanceMonitor';

/**
 * Hook för att mäta prestandaegenskaper hos navigationshändelser
 */
export const useNavigationPerformance = (currentScreenName: string) => {
  const router = useRouter();
  const performanceMonitor = UIPerformanceMonitor.getInstance();
  const currentScreen = useRef(currentScreenName);
  
  /**
   * Navigera till en annan skärm och mät prestanda
   */
  const navigateToWithTracking = useCallback(async (
    screenName: string,
    params?: Record<string, string>
  ) => {
    return performanceMonitor.measureScreenTransition(
      currentScreen.current,
      screenName,
      async () => {
        if (params) {
          router.push({ pathname: screenName, params });
        } else {
          router.push(screenName);
        }
        
        // Uppdatera aktuell skärm
        currentScreen.current = screenName;
      }
    );
  }, [router]);
  
  /**
   * Gå tillbaka och mät prestanda
   */
  const goBackWithTracking = useCallback(async () => {
    return performanceMonitor.measureScreenTransition(
      currentScreen.current,
      'previous_screen',
      async () => {
        router.back();
        
        // Vi vet inte vilken skärm vi gått tillbaka till, så vi använder en generisk etikett
        currentScreen.current = 'previous_screen';
      }
    );
  }, [router]);
  
  /**
   * Ersätt aktuell skärm och mät prestanda
   */
  const replaceWithTracking = useCallback(async (
    screenName: string,
    params?: Record<string, string>
  ) => {
    return performanceMonitor.measureScreenTransition(
      currentScreen.current,
      screenName,
      async () => {
        if (params) {
          router.replace({ pathname: screenName, params });
        } else {
          router.replace(screenName);
        }
        
        // Uppdatera aktuell skärm
        currentScreen.current = screenName;
      }
    );
  }, [router]);
  
  return {
    navigateToWithTracking,
    goBackWithTracking,
    replaceWithTracking,
    currentScreenName: currentScreen.current
  };
};

export default useNavigationPerformance; 