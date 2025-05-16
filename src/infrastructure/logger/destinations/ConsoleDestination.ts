import { ILogDestination, LogLevel } from '../ILogger';

/**
 * Konsolloggningsdestination
 * Implementerar ILogDestination för att skicka loggar till konsolen
 */
export class ConsoleDestination implements ILogDestination {
  /**
   * Loggar ett formaterat meddelande till konsolen
   * 
   * @param level Loggnivå 
   * @param formattedMessage Formaterat meddelande att logga
   */
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