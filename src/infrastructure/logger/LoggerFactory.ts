import { ILogger, LoggingOptions, LogLevel } from './ILogger';
import { LoggerService } from './LoggerService';

/**
 * Factory-klass för att skapa logger-instanser
 * Detta möjliggör flexibel konfiguration och testning av loggning i applikationen
 */
export class LoggerFactory {
  /**
   * Standardinställningar för loggning
   */
  private static defaultOptions: LoggingOptions = {
    minLevel: LogLevel.INFO,
    timestamps: true,
    remoteLogging: false
  };
  
  /**
   * Skapar en ny logger med angiven konfiguration
   * 
   * @param options Specifika loggningsalternativ
   * @returns Implementering av ILogger
   */
  static createLogger(options?: LoggingOptions): ILogger {
    const mergedOptions: LoggingOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    return LoggerService.getInstance(mergedOptions);
  }
  
  /**
   * Skapar en logger för utvecklingsmiljö med lämpliga inställningar
   * 
   * @returns Implementering av ILogger
   */
  static createDevelopmentLogger(): ILogger {
    return this.createLogger({
      minLevel: LogLevel.DEBUG,
      timestamps: true,
      remoteLogging: false
    });
  }
  
  /**
   * Skapar en logger för produktionsmiljö med lämpliga inställningar
   * 
   * @param remoteUrl URL till fjärrloggningsserver
   * @returns Implementering av ILogger
   */
  static createProductionLogger(remoteUrl?: string): ILogger {
    return this.createLogger({
      minLevel: LogLevel.INFO,
      timestamps: true,
      remoteLogging: !!remoteUrl,
      remoteUrl: remoteUrl
    });
  }
  
  /**
   * Skapar en logger för testmiljö som inte loggar något
   * 
   * @returns Implementering av ILogger
   */
  static createTestLogger(): ILogger {
    const logger = this.createLogger({
      minLevel: LogLevel.CRITICAL
    });
    
    // Inaktivera all loggning för tester
    if (logger instanceof LoggerService) {
      logger.disableLogging();
    }
    
    return logger;
  }
  
  /**
   * Updaterar standardinställningar för loggning
   * 
   * @param options Nya standardinställningar
   */
  static setDefaultOptions(options: Partial<LoggingOptions>): void {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options
    };
  }
} 