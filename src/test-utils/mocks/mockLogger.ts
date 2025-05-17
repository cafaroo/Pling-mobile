import { Logger } from '@/infrastructure/logger/Logger';

/**
 * MockLogger - En mock-implementation av Logger för användning i tester
 */
export class MockLogger implements Logger {
  private logs: { level: string; message: string; meta?: any }[] = [];

  /**
   * Loggar ett info-meddelande
   */
  info(message: string, meta?: any): void {
    this.logs.push({ level: 'info', message, meta });
  }

  /**
   * Loggar ett varningsmeddelande
   */
  warn(message: string, meta?: any): void {
    this.logs.push({ level: 'warn', message, meta });
  }

  /**
   * Loggar ett felmeddelande
   */
  error(message: string, meta?: any): void {
    this.logs.push({ level: 'error', message, meta });
  }

  /**
   * Loggar ett debugmeddelande
   */
  debug(message: string, meta?: any): void {
    this.logs.push({ level: 'debug', message, meta });
  }

  /**
   * Hämtar alla loggade meddelanden
   */
  getLogs(): { level: string; message: string; meta?: any }[] {
    return [...this.logs];
  }

  /**
   * Hämtar alla meddelanden av en viss nivå
   */
  getLogsByLevel(level: string): { level: string; message: string; meta?: any }[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Rensar alla loggade meddelanden
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Kontrollerar om ett specifikt meddelande har loggats
   */
  hasLoggedMessage(level: string, message: string): boolean {
    return this.logs.some(log => 
      log.level === level && log.message.includes(message)
    );
  }
}

/**
 * Exportera en default-instans för enkel användning
 */
export const mockLogger = new MockLogger();

export default mockLogger; 