import { PerformanceMonitor, OperationType, PerformanceMeasurement } from './PerformanceMonitor';
import { InteractionManager } from 'react-native';

/**
 * Enum för olika typer av UI-prestanda som mäts
 */
export enum UIPerformanceMetricType {
  COMPONENT_RENDER = 'component_render',
  COMPONENT_MOUNT = 'component_mount',
  COMPONENT_UPDATE = 'component_update',
  COMPONENT_UNMOUNT = 'component_unmount',
  SCREEN_NAVIGATION = 'screen_navigation',
  USER_INTERACTION = 'user_interaction',
  ANIMATION = 'animation',
  LAYOUT_CALCULATION = 'layout_calculation',
  LIST_RENDERING = 'list_rendering',
}

/**
 * Gränssnitt för UI-prestandamätning
 */
export interface UIPerformanceMeasurement extends PerformanceMeasurement {
  type: UIPerformanceMetricType;
  componentName?: string;
  componentId?: string;
  screenName?: string;
  interactionName?: string;
  frameDrops?: number;
  jsThreadTime?: number;
  nativeThreadTime?: number;
}

/**
 * Konfigurationsalternativ för UIPerformanceMonitor
 */
export interface UIPerformanceMonitorOptions {
  enabled?: boolean;
  slowComponentThreshold?: number; // ms för långsam komponentrendering
  slowNavigationThreshold?: number; // ms för långsam navigation
  frameDropThreshold?: number; // antal tappade frames för varning
  reportToConsole?: boolean; 
  sampleRate?: number; // 0-1, andel mätningar som samlas in
}

/**
 * Klass för att övervaka UI-prestanda i React Native-applikationen
 */
export class UIPerformanceMonitor {
  private static instance: UIPerformanceMonitor;
  private readonly performanceMonitor: PerformanceMonitor;
  
  private enabled: boolean;
  private slowComponentThreshold: number;
  private slowNavigationThreshold: number;
  private frameDropThreshold: number;
  private reportToConsole: boolean;
  private sampleRate: number;
  
  private activeRenderings: Map<string, string> = new Map();
  private interactionHandles: Map<string, number> = new Map();
  
  private constructor(options: UIPerformanceMonitorOptions = {}) {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    
    this.enabled = options.enabled !== false;
    this.slowComponentThreshold = options.slowComponentThreshold || 16; // 16ms = 1 frame vid 60fps
    this.slowNavigationThreshold = options.slowNavigationThreshold || 300; // 300ms
    this.frameDropThreshold = options.frameDropThreshold || 3; // 3 tappade frames
    this.reportToConsole = options.reportToConsole || false;
    this.sampleRate = options.sampleRate !== undefined ? options.sampleRate : 0.1; // 10% standard
  }
  
  /**
   * Hämta instans av UIPerformanceMonitor
   */
  public static getInstance(options?: UIPerformanceMonitorOptions): UIPerformanceMonitor {
    if (!UIPerformanceMonitor.instance) {
      UIPerformanceMonitor.instance = new UIPerformanceMonitor(options);
    } else if (options) {
      UIPerformanceMonitor.instance.updateOptions(options);
    }
    
    return UIPerformanceMonitor.instance;
  }
  
  /**
   * Uppdatera övervakningsalternativ
   */
  updateOptions(options: UIPerformanceMonitorOptions): void {
    if (options.enabled !== undefined) {
      this.enabled = options.enabled;
    }
    
    if (options.slowComponentThreshold !== undefined) {
      this.slowComponentThreshold = options.slowComponentThreshold;
    }
    
    if (options.slowNavigationThreshold !== undefined) {
      this.slowNavigationThreshold = options.slowNavigationThreshold;
    }
    
    if (options.frameDropThreshold !== undefined) {
      this.frameDropThreshold = options.frameDropThreshold;
    }
    
    if (options.reportToConsole !== undefined) {
      this.reportToConsole = options.reportToConsole;
    }
    
    if (options.sampleRate !== undefined) {
      this.sampleRate = options.sampleRate;
    }
  }
  
  /**
   * Avgör om mätning ska göras baserat på sampling rate
   */
  private shouldSample(): boolean {
    return Math.random() <= this.sampleRate;
  }
  
  /**
   * Påbörja mätning av komponentrendering
   */
  startComponentRender(componentName: string, componentId?: string): string | null {
    if (!this.enabled || !this.shouldSample()) return null;
    
    const operationId = this.performanceMonitor.startOperation(
      OperationType.COMPUTATION,
      `render_${componentName}`,
      { componentName, componentId }
    );
    
    if (componentId) {
      this.activeRenderings.set(componentId, operationId);
    }
    
    return operationId;
  }
  
  /**
   * Avsluta mätning av komponentrendering
   */
  endComponentRender(componentId: string | null, operationId?: string): void {
    if (!this.enabled || !componentId && !operationId) return;
    
    let id = operationId;
    
    if (!id && componentId) {
      id = this.activeRenderings.get(componentId) || '';
      this.activeRenderings.delete(componentId);
    }
    
    if (id) {
      this.performanceMonitor.endOperation(id);
    }
  }
  
  /**
   * Mät renderingstid för en komponent
   */
  measureComponentRender<T>(
    componentName: string, 
    renderFunction: () => T,
    componentId?: string
  ): T {
    if (!this.enabled || !this.shouldSample()) return renderFunction();
    
    const opId = this.startComponentRender(componentName, componentId);
    try {
      const result = renderFunction();
      if (opId) this.endComponentRender(null, opId);
      return result;
    } catch (error) {
      if (opId) this.endComponentRender(null, opId);
      throw error;
    }
  }
  
  /**
   * Påbörja mätning av skärmnavigation
   */
  startScreenNavigation(fromScreen: string, toScreen: string): string | null {
    if (!this.enabled || !this.shouldSample()) return null;
    
    return this.performanceMonitor.startOperation(
      OperationType.COMPUTATION,
      `navigation_${fromScreen}_to_${toScreen}`,
      { fromScreen, toScreen, type: UIPerformanceMetricType.SCREEN_NAVIGATION }
    );
  }
  
  /**
   * Avsluta mätning av skärmnavigation
   */
  endScreenNavigation(operationId: string | null): void {
    if (!this.enabled || !operationId) return;
    
    this.performanceMonitor.endOperation(operationId);
  }
  
  /**
   * Mät navigation mellan skärmar med InteractionManager
   */
  async measureScreenTransition(
    fromScreen: string,
    toScreen: string,
    navigationAction: () => Promise<void>
  ): Promise<void> {
    if (!this.enabled || !this.shouldSample()) return navigationAction();
    
    const opId = this.startScreenNavigation(fromScreen, toScreen);
    
    try {
      await navigationAction();
      
      // Vänta på att alla interaktioner är klara
      await new Promise<void>(resolve => {
        const handle = InteractionManager.runAfterInteractions(() => {
          if (opId) this.endScreenNavigation(opId);
          resolve();
        });
        
        if (opId) {
          this.interactionHandles.set(opId, handle);
        }
      });
    } catch (error) {
      if (opId) {
        if (this.interactionHandles.has(opId)) {
          InteractionManager.clearInteractionHandle(this.interactionHandles.get(opId)!);
          this.interactionHandles.delete(opId);
        }
        this.endScreenNavigation(opId);
      }
      throw error;
    }
  }
  
  /**
   * Mät användarinteraktion
   */
  async measureInteraction<T>(
    interactionName: string,
    interactionFunc: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled || !this.shouldSample()) return interactionFunc();
    
    const opId = this.performanceMonitor.startOperation(
      OperationType.COMPUTATION,
      `interaction_${interactionName}`,
      { interactionName, type: UIPerformanceMetricType.USER_INTERACTION }
    );
    
    try {
      const result = await interactionFunc();
      this.performanceMonitor.endOperation(opId);
      return result;
    } catch (error) {
      this.performanceMonitor.endOperation(opId, false);
      throw error;
    }
  }
  
  /**
   * Mät prestanda för listrendering
   */
  measureListRendering(
    listName: string,
    itemCount: number
  ): string | null {
    if (!this.enabled || !this.shouldSample()) return null;
    
    return this.performanceMonitor.startOperation(
      OperationType.COMPUTATION,
      `list_rendering_${listName}`,
      { 
        listName, 
        itemCount,
        type: UIPerformanceMetricType.LIST_RENDERING 
      }
    );
  }
  
  /**
   * Avsluta mätning av listrendering
   */
  endListRendering(operationId: string | null, visibleItemCount?: number): void {
    if (!this.enabled || !operationId) return;
    
    const parameters = visibleItemCount ? { visibleItemCount } : undefined;
    this.performanceMonitor.endOperation(operationId, true);
  }
  
  /**
   * Hämta alla UI-prestandamätningar
   */
  getUIMeasurements(): PerformanceMeasurement[] {
    return this.performanceMonitor.getMeasurements().filter(m => 
      m.parameters?.type && Object.values(UIPerformanceMetricType).includes(m.parameters.type as UIPerformanceMetricType)
    );
  }
}

export default UIPerformanceMonitor; 