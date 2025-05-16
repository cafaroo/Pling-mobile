/**
 * Loggnivåer
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4
}

/**
 * Gränssnitt för logger
 * Detta interface definierar den centrala kontraktet för all loggning i applikationen
 */
export interface ILogger {
  /**
   * Logga ett debug-meddelande
   */
  debug(message: string, context?: Record<string, any>): void;
  
  /**
   * Logga ett informationsmeddelande
   */
  info(message: string, context?: Record<string, any>): void;
  
  /**
   * Logga en varning
   */
  warning(message: string, context?: Record<string, any>): void;
  
  /**
   * Logga ett felmeddelande
   */
  error(message: string, context?: Record<string, any>): void;
  
  /**
   * Logga ett kritiskt fel
   */
  critical(message: string, context?: Record<string, any>): void;
  
  /**
   * Spåra en händelse (för analytics)
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void;
  
  /**
   * Spåra en skärmvisning (för analytics)
   */
  trackScreen(screenName: string, properties?: Record<string, any>): void;
}

/**
 * Loggningsalternativ
 */
export interface LoggingOptions {
  /**
   * Minimal loggnivå att visa (default: INFO)
   */
  minLevel?: LogLevel;
  
  /**
   * Om tidsstämplar ska inkluderas (default: true)
   */
  timestamps?: boolean;
  
  /**
   * Om loggar ska skickas till extern server (default: false)
   */
  remoteLogging?: boolean;
  
  /**
   * URL för extern loggserver (om remoteLogging är true)
   */
  remoteUrl?: string;
  
  /**
   * Batch-storlek för fjärrloggning (default: 10)
   */
  batchSize?: number;
  
  /**
   * Anpassad implementation för spårning av användarmätning
   */
  analyticsCallback?: (event: string, properties?: Record<string, any>) => void;
}

/**
 * Gränssnitt för loggformateraren
 */
export interface ILogFormatter {
  format(level: LogLevel, message: string, context?: Record<string, any>): string;
}

/**
 * Gränssnitt för loggdestinationer
 */
export interface ILogDestination {
  log(level: LogLevel, formattedMessage: string): void;
} 