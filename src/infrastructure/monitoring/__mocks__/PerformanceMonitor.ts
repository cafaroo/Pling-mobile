export enum OperationType {
  DATABASE_READ = 'DATABASE_READ',
  DATABASE_WRITE = 'DATABASE_WRITE',
  CACHE_READ = 'CACHE_READ',
  CACHE_WRITE = 'CACHE_WRITE',
  API_CALL = 'API_CALL',
  COMPUTATION = 'COMPUTATION'
}

export class PerformanceMonitor {
  static getInstance() {
    return {
      measure: jest.fn().mockImplementation((_, __, fn) => fn()),
    };
  }
} 