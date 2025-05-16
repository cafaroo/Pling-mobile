import { ILogDestination, LogLevel } from '../ILogger';

/**
 * Fjärrserverdestination för loggning
 * Implementerar ILogDestination för att skicka loggar till en extern server
 */
export class RemoteDestination implements ILogDestination {
  /**
   * Kö med loggar som väntar på att skickas
   */
  private queue: string[] = [];
  
  /**
   * Flagga som indikerar om skickning pågår för närvarande
   */
  private sending: boolean = false;

  /**
   * Skapar en ny RemoteDestination
   * 
   * @param url URL till fjärrservern
   * @param batchSize Antal loggar att skicka i varje batch
   */
  constructor(private readonly url: string, private readonly batchSize: number = 10) {}
  
  /**
   * Loggar ett formaterat meddelande till fjärrservern
   * 
   * @param level Loggnivå
   * @param formattedMessage Formaterat meddelande att logga
   */
  log(level: LogLevel, formattedMessage: string): void {
    // Lägg till i kön
    this.queue.push(formattedMessage);
    
    // Skicka om kön är full
    if (this.queue.length >= this.batchSize) {
      this.sendLogs();
    }
  }
  
  /**
   * Skickar loggar till fjärrservern
   */
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
  
  /**
   * Tvinga skickning av loggar
   */
  flush(): void {
    if (this.queue.length > 0) {
      this.sendLogs();
    }
  }
} 