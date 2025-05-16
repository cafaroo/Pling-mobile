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