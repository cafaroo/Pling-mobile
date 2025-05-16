import { ILogFormatter, LogLevel } from '../ILogger';

/**
 * Standard-formaterare för loggar
 * Implementerar ILogFormatter med standard formatering av loggmeddelanden
 */
export class DefaultFormatter implements ILogFormatter {
  /**
   * Skapar en ny DefaultFormatter
   * 
   * @param includeTimestamp Om tidsstämplar ska inkluderas i loggmeddelanden
   */
  constructor(private readonly includeTimestamp: boolean = true) {}
  
  /**
   * Formaterar ett loggmeddelande
   * 
   * @param level Loggnivå
   * @param message Meddelande att logga
   * @param context Valfri extra kontextinformation
   * @returns Formaterat loggmeddelande
   */
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