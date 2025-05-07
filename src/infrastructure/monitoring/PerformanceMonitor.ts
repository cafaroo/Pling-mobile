import { LoggingService } from '../logger/LoggingService';

/**
 * Typ av operation som övervakas
 */
export enum OperationType {
  DATABASE_READ = 'database_read',
  DATABASE_WRITE = 'database_write',
  NETWORK_REQUEST = 'network_request',
  CACHE_OPERATION = 'cache_operation',
  COMPUTATION = 'computation'
}

/**
 * Prestationsmätning för en operation
 */
export interface PerformanceMeasurement {
  /**
   * Typ av operation
   */
  type: OperationType;
  
  /**
   * Namn på operationen (t.ex. "getUserById")
   */
  name: string;
  
  /**
   * Starttid (tidsstämpel i ms)
   */
  startTime: number;
  
  /**
   * Sluttid (tidsstämpel i ms)
   */
  endTime?: number;
  
  /**
   * Varaktighet (ms)
   */
  duration?: number;
  
  /**
   * Status (lyckades/misslyckades)
   */
  success: boolean;
  
  /**
   * Relaterade parametrar
   */
  parameters?: Record<string, any>;
}

/**
 * Prestandaövervakningsalternativ
 */
export interface PerformanceMonitorOptions {
  /**
   * Om övervakning är aktiv
   */
  enabled?: boolean;
  
  /**
   * Tröskel för långsamma operationer (ms)
   */
  slowThreshold?: number;
  
  /**
   * Om mätningar ska skickas till loggservern
   */
  remoteReporting?: boolean;
  
  /**
   * Hur ofta mätningar ska rapporteras (ms)
   */
  reportingInterval?: number;
}

/**
 * Tjänst för att övervaka prestanda i applikationen
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  private readonly logger: LoggingService;
  private enabled: boolean;
  private readonly slowThreshold: number;
  private readonly remoteReporting: boolean;
  private readonly reportingInterval: number;
  
  private measurements: PerformanceMeasurement[] = [];
  private activeOperations: Map<string, PerformanceMeasurement> = new Map();
  private reportingTimer?: NodeJS.Timeout;
  
  private constructor(options: PerformanceMonitorOptions = {}) {
    this.logger = LoggingService.getInstance();
    this.enabled = options.enabled !== false;
    this.slowThreshold = options.slowThreshold || 300; // 300ms standard
    this.remoteReporting = options.remoteReporting || false;
    this.reportingInterval = options.reportingInterval || 60000; // 1 minut standard
    
    if (this.enabled && this.remoteReporting) {
      this.startReporting();
    }
  }
  
  /**
   * Hämta instans av prestandaövervakningen
   */
  public static getInstance(options?: PerformanceMonitorOptions): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(options);
    } else if (options) {
      PerformanceMonitor.instance.updateOptions(options);
    }
    
    return PerformanceMonitor.instance;
  }
  
  /**
   * Uppdatera övervakningsalternativ
   */
  updateOptions(options: PerformanceMonitorOptions): void {
    if (options.enabled !== undefined) {
      this.enabled = options.enabled;
    }
    
    if (options.slowThreshold) {
      this.slowThreshold = options.slowThreshold;
    }
    
    if (options.remoteReporting !== undefined) {
      this.remoteReporting = options.remoteReporting;
    }
    
    if (options.reportingInterval) {
      this.reportingInterval = options.reportingInterval;
    }
    
    // Starta eller stoppa rapportering beroende på inställningar
    if (this.enabled && this.remoteReporting) {
      this.startReporting();
    } else {
      this.stopReporting();
    }
  }
  
  /**
   * Starta en övervakad operation
   */
  startOperation(
    type: OperationType,
    name: string,
    parameters?: Record<string, any>
  ): string {
    if (!this.enabled) return name;
    
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const measurement: PerformanceMeasurement = {
      type,
      name,
      startTime: Date.now(),
      success: true,
      parameters
    };
    
    this.activeOperations.set(id, measurement);
    return id;
  }
  
  /**
   * Avsluta en övervakad operation
   */
  endOperation(id: string, success: boolean = true): void {
    if (!this.enabled) return;
    
    const measurement = this.activeOperations.get(id);
    if (!measurement) return;
    
    measurement.endTime = Date.now();
    measurement.duration = measurement.endTime - measurement.startTime;
    measurement.success = success;
    
    this.activeOperations.delete(id);
    this.measurements.push(measurement);
    
    // Logga långsamma operationer
    if (measurement.duration > this.slowThreshold) {
      this.logger.warning(`Långsam operation: ${measurement.name} (${measurement.duration}ms)`, {
        type: measurement.type,
        parameters: measurement.parameters
      });
    }
  }
  
  /**
   * Mät en operation med en callback-funktion
   */
  async measure<T>(
    type: OperationType,
    name: string,
    operation: () => Promise<T>,
    parameters?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) return operation();
    
    const id = this.startOperation(type, name, parameters);
    
    try {
      const result = await operation();
      this.endOperation(id, true);
      return result;
    } catch (error) {
      this.endOperation(id, false);
      throw error;
    }
  }
  
  /**
   * Hämta alla mätningar
   */
  getMeasurements(): PerformanceMeasurement[] {
    return [...this.measurements];
  }
  
  /**
   * Rensa alla mätningar
   */
  clearMeasurements(): void {
    this.measurements = [];
  }
  
  /**
   * Starta rapportering av mätningar
   */
  private startReporting(): void {
    this.stopReporting();
    
    this.reportingTimer = setInterval(() => {
      this.reportMeasurements();
    }, this.reportingInterval);
  }
  
  /**
   * Stoppa rapportering av mätningar
   */
  private stopReporting(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = undefined;
    }
  }
  
  /**
   * Rapportera mätningar till loggservern
   */
  private reportMeasurements(): void {
    if (this.measurements.length === 0) return;
    
    // Beräkna statistik
    const stats = this.calculateStatistics();
    
    // Logga statistik
    this.logger.info('Prestandarapport', stats);
    
    // Rensa mätningar efter rapportering
    this.clearMeasurements();
  }
  
  /**
   * Beräkna statistik från mätningar
   */
  private calculateStatistics(): Record<string, any> {
    const stats: Record<string, any> = {
      totalOperations: this.measurements.length,
      successRate: 0,
      averageDuration: 0,
      slowOperations: 0,
      operationTypes: {} as Record<string, {
        count: number,
        successCount: number,
        totalDuration: number,
        avgDuration: number
      }>
    };
    
    let totalDuration = 0;
    let successCount = 0;
    
    for (const m of this.measurements) {
      if (!m.duration) continue;
      
      // Räkna framgångsrika operationer
      if (m.success) {
        successCount++;
      }
      
      // Summera varaktighet
      totalDuration += m.duration;
      
      // Räkna långsamma operationer
      if (m.duration > this.slowThreshold) {
        stats.slowOperations++;
      }
      
      // Gruppera efter operationstyp
      if (!stats.operationTypes[m.type]) {
        stats.operationTypes[m.type] = {
          count: 0,
          successCount: 0,
          totalDuration: 0,
          avgDuration: 0
        };
      }
      
      const typeStats = stats.operationTypes[m.type];
      typeStats.count++;
      if (m.success) typeStats.successCount++;
      typeStats.totalDuration += m.duration;
    }
    
    // Beräkna genomsnitt
    if (this.measurements.length > 0) {
      stats.successRate = (successCount / this.measurements.length) * 100;
      stats.averageDuration = totalDuration / this.measurements.length;
      
      // Beräkna genomsnitt per typ
      for (const type in stats.operationTypes) {
        const typeStats = stats.operationTypes[type];
        if (typeStats.count > 0) {
          typeStats.avgDuration = typeStats.totalDuration / typeStats.count;
        }
      }
    }
    
    return stats;
  }
} 