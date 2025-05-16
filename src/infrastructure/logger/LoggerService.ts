import { ILogger, LogLevel, LoggingOptions, ILogDestination, ILogFormatter } from './ILogger';
import { DefaultFormatter } from './formatters/DefaultFormatter';
import { ConsoleDestination } from './destinations/ConsoleDestination';
import { RemoteDestination } from './destinations/RemoteDestination';

/**
 * Loggningstjänst för att hantera och skicka loggar
 * Implementerar ILogger för att tillhandahålla olika loggnivåer och destinationer
 */
export class LoggerService implements ILogger {
  /**
   * Singleton-instans av loggningstjänsten
   */
  private static instance: LoggerService;
  
  /**
   * Minimal loggnivå att visa
   */
  private minLevel: LogLevel;
  
  /**
   * Formaterare för loggar
   */
  private readonly formatter: ILogFormatter;
  
  /**
   * Loggdestinationer
   */
  private readonly destinations: ILogDestination[] = [];
  
  /**
   * Callback för analysspårning
   */
  private readonly analyticsCallback?: (event: string, properties?: Record<string, any>) => void;
  
  /**
   * Skapar en ny LoggerService
   * 
   * @param options Loggningsalternativ
   */
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
   * 
   * @param options Loggningsalternativ
   * @returns Instans av LoggerService
   */
  public static getInstance(options?: LoggingOptions): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService(options);
    } else if (options) {
      // Uppdatera befintlig instans med nya alternativ
      LoggerService.instance.updateOptions(options);
    }
    
    return LoggerService.instance;
  }
  
  /**
   * Uppdatera loggningstjänstens alternativ
   * 
   * @param options Nya loggningsalternativ
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
   * 
   * @param level Loggnivå
   * @param message Meddelande att logga
   * @param context Valfri extra kontextinformation
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.minLevel) return;
    
    const formattedMessage = this.formatter.format(level, message, context);
    
    for (const destination of this.destinations) {
      destination.log(level, formattedMessage);
    }
  }
  
  /**
   * Logga ett debug-meddelande
   * 
   * @param message Meddelande att logga
   * @param context Valfri extra kontextinformation
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * Logga ett informationsmeddelande
   * 
   * @param message Meddelande att logga
   * @param context Valfri extra kontextinformation
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  /**
   * Logga en varning
   * 
   * @param message Meddelande att logga
   * @param context Valfri extra kontextinformation
   */
  warning(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARNING, message, context);
  }
  
  /**
   * Logga ett felmeddelande
   * 
   * @param message Meddelande att logga
   * @param context Valfri extra kontextinformation
   */
  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }
  
  /**
   * Logga ett kritiskt fel
   * 
   * @param message Meddelande att logga
   * @param context Valfri extra kontextinformation
   */
  critical(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.CRITICAL, message, context);
  }
  
  /**
   * Spåra en händelse (för analytics)
   * 
   * @param eventName Namn på händelsen
   * @param properties Valfria egenskaper för händelsen
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (this.analyticsCallback) {
      this.analyticsCallback(eventName, properties);
    }
    
    const message = `Händelse: ${eventName}`;
    this.log(LogLevel.DEBUG, message, properties);
  }
  
  /**
   * Spåra en skärmvisning (för analytics)
   * 
   * @param screenName Namn på skärmen
   * @param properties Valfria egenskaper för skärmvisningen
   */
  trackScreen(screenName: string, properties?: Record<string, any>): void {
    if (this.analyticsCallback) {
      this.analyticsCallback(`screen_view: ${screenName}`, properties);
    }
    
    const message = `Skärm visad: ${screenName}`;
    this.log(LogLevel.DEBUG, message, properties);
  }
  
  /**
   * Lägger till en anpassad destination
   * 
   * @param destination Ny loggdestination
   */
  addDestination(destination: ILogDestination): void {
    this.destinations.push(destination);
  }
  
  /**
   * Rensar alla destinationer
   */
  clearDestinations(): void {
    this.destinations.length = 0;
    // Återställ standarddestination
    this.destinations.push(new ConsoleDestination());
  }
  
  /**
   * Stäng av alla loggningsdestinationer
   * Användbart för testning
   */
  disableLogging(): void {
    this.minLevel = LogLevel.CRITICAL + 1; // Högre än högsta nivån
  }
  
  /**
   * Återaktivera loggning
   * 
   * @param level Minimal loggnivå att visa
   */
  enableLogging(level: LogLevel = LogLevel.INFO): void {
    this.minLevel = level;
  }
} 