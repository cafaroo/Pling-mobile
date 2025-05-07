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
export interface LogFormatter {
  format(level: LogLevel, message: string, context?: Record<string, any>): string;
}

/**
 * Gränssnitt för loggdestinationer
 */
export interface LogDestination {
  log(level: LogLevel, formattedMessage: string): void;
}

/**
 * Standard-formaterare för loggar
 */
class DefaultFormatter implements LogFormatter {
  private readonly includeTimestamp: boolean;
  
  constructor(includeTimestamp: boolean = true) {
    this.includeTimestamp = includeTimestamp;
  }
  
  format(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = this.includeTimestamp ? `[${new Date().toISOString()}] ` : '';
    const levelName = LogLevel[level];
    
    let formattedMessage = `${timestamp}${levelName}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      try {
        formattedMessage += ` | ${JSON.stringify(context)}`;
      } catch (error) {
        formattedMessage += ` | [Kontext kunde inte formateras]`;
      }
    }
    
    return formattedMessage;
  }
}

/**
 * Konsolloggningsdestination
 */
class ConsoleDestination implements LogDestination {
  log(level: LogLevel, formattedMessage: string): void {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARNING:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage);
        break;
    }
  }
}

/**
 * Fjärrserverdestination för loggning
 */
class RemoteDestination implements LogDestination {
  private readonly url: string;
  private queue: string[] = [];
  private readonly batchSize: number;
  private sending: boolean = false;
  
  constructor(url: string, batchSize: number = 10) {
    this.url = url;
    this.batchSize = batchSize;
  }
  
  log(level: LogLevel, formattedMessage: string): void {
    // Lägg till i kön
    this.queue.push(formattedMessage);
    
    // Skicka om kön är full
    if (this.queue.length >= this.batchSize) {
      this.sendLogs();
    }
  }
  
  private async sendLogs(): Promise<void> {
    if (this.sending || this.queue.length === 0) return;
    
    this.sending = true;
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs: batch })
      });
    } catch (error) {
      console.error('Kunde inte skicka loggar till fjärrserver:', error);
      // Lägg tillbaka loggarna i kön vid fel
      this.queue = [...batch, ...this.queue];
    } finally {
      this.sending = false;
      
      // Om det finns fler loggar, fortsätt skicka
      if (this.queue.length >= this.batchSize) {
        this.sendLogs();
      }
    }
  }
  
  // Tvinga skickning av loggar
  flush(): void {
    if (this.queue.length > 0) {
      this.sendLogs();
    }
  }
}

/**
 * Loggningstjänst för att hantera och skicka loggar
 */
export class LoggingService {
  private static instance: LoggingService;
  
  private readonly minLevel: LogLevel;
  private readonly formatter: LogFormatter;
  private readonly destinations: LogDestination[] = [];
  private readonly analyticsCallback?: (event: string, properties?: Record<string, any>) => void;
  
  private constructor(options: LoggingOptions = {}) {
    this.minLevel = options.minLevel !== undefined ? options.minLevel : LogLevel.INFO;
    this.formatter = new DefaultFormatter(options.timestamps !== false);
    
    // Standarddestination är alltid konsolen
    this.destinations.push(new ConsoleDestination());
    
    // Lägg till fjärrserverdestination om aktiverad
    if (options.remoteLogging && options.remoteUrl) {
      this.destinations.push(
        new RemoteDestination(options.remoteUrl, options.batchSize)
      );
    }
    
    // Spara analytics callback om den finns
    this.analyticsCallback = options.analyticsCallback;
  }
  
  /**
   * Hämta instans av loggningstjänsten
   */
  public static getInstance(options?: LoggingOptions): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService(options);
    } else if (options) {
      // Uppdatera befintlig instans med nya alternativ
      LoggingService.instance.updateOptions(options);
    }
    
    return LoggingService.instance;
  }
  
  /**
   * Uppdatera loggningstjänstens alternativ
   */
  private updateOptions(options: LoggingOptions): void {
    if (options.minLevel !== undefined) {
      this.minLevel = options.minLevel;
    }
    
    // Rensa befintliga destinationer
    this.destinations.length = 0;
    
    // Lägg till standarddestination
    this.destinations.push(new ConsoleDestination());
    
    // Lägg till fjärrserverdestination om aktiverad
    if (options.remoteLogging && options.remoteUrl) {
      this.destinations.push(
        new RemoteDestination(options.remoteUrl, options.batchSize)
      );
    }
  }
  
  /**
   * Logga ett meddelande
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.minLevel) return;
    
    const formattedMessage = this.formatter.format(level, message, context);
    
    for (const destination of this.destinations) {
      destination.log(level, formattedMessage);
    }
  }
  
  /**
   * Logga ett debugmeddelande
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * Logga ett informationsmeddelande
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  /**
   * Logga ett varningsmeddelande
   */
  warning(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARNING, message, context);
  }
  
  /**
   * Logga ett felmeddelande
   */
  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }
  
  /**
   * Logga ett kritiskt fel
   */
  critical(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.CRITICAL, message, context);
  }
  
  /**
   * Spåra en användaråtgärd för analys
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    // Logga händelsen lokalt först
    this.info(`EVENT: ${eventName}`, properties);
    
    // Anropa analyticsCallback om den finns
    if (this.analyticsCallback) {
      try {
        this.analyticsCallback(eventName, properties);
      } catch (error) {
        this.error(`Fel vid anrop av analytics callback: ${error}`, {
          eventName,
          properties
        });
      }
    }
  }
  
  /**
   * Spåra en användarvy för analys
   */
  trackScreen(screenName: string, properties?: Record<string, any>): void {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties
    });
  }
} 