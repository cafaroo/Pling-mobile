/**
 * Logger-implementation för applikationen
 */

// Exportera interfaces
export * from './ILogger';

// Exportera huvudimplementation
export * from './LoggerService';
export * from './LoggerFactory';

// Exportera formaterare
export * from './formatters/DefaultFormatter';

// Exportera destinationer
export * from './destinations/ConsoleDestination';
export * from './destinations/RemoteDestination';

// Skapa och exportera default logger
import { LoggerFactory } from './LoggerFactory';

// Exportera en standardinstans för enkel användning
export const logger = LoggerFactory.createLogger();

// För utvecklingsmiljö
export const devLogger = LoggerFactory.createDevelopmentLogger();

// För testmiljö
export const testLogger = LoggerFactory.createTestLogger();

// Loggningsnivåer
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Interface för logger
export interface Logger {
  debug(message: string, ...meta: any[]): void;
  info(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  error(message: string, error?: Error, ...meta: any[]): void;
}

// Global inställning för minsta loggnivå
let globalLogLevel: LogLevel = LogLevel.INFO;

/**
 * Sätter global loggnivå
 */
export function setGlobalLogLevel(level: LogLevel): void {
  globalLogLevel = level;
}

/**
 * Avgör om en viss loggnivå ska loggas baserat på global inställning
 */
function shouldLog(level: LogLevel): boolean {
  const levelOrder = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3
  };

  return levelOrder[level] >= levelOrder[globalLogLevel];
}

/**
 * Skapar en ny logger för ett specifikt modul/kontext
 * @param context Namn på modulen/kontexten
 */
export function createLogger(context: string): Logger {
  return {
    debug(message: string, ...meta: any[]): void {
      if (shouldLog(LogLevel.DEBUG)) {
        console.debug(`[${context}] ${message}`, ...meta);
      }
    },

    info(message: string, ...meta: any[]): void {
      if (shouldLog(LogLevel.INFO)) {
        console.info(`[${context}] ${message}`, ...meta);
      }
    },

    warn(message: string, ...meta: any[]): void {
      if (shouldLog(LogLevel.WARN)) {
        console.warn(`[${context}] ${message}`, ...meta);
      }
    },

    error(message: string, error?: Error, ...meta: any[]): void {
      if (shouldLog(LogLevel.ERROR)) {
        if (error) {
          console.error(`[${context}] ${message}`, error, ...meta);
        } else {
          console.error(`[${context}] ${message}`, ...meta);
        }
      }
    }
  };
}

// Skapa en default logger
export const defaultLogger = createLogger('app');

// För enkel import
export default {
  createLogger,
  setGlobalLogLevel,
  defaultLogger
}; 