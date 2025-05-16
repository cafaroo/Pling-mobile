import { LoggerService } from '../LoggerService';
import { LogLevel, ILogDestination } from '../ILogger';

/**
 * Mock-destination för testning av logger
 */
class MockDestination implements ILogDestination {
  public logs: Array<{ level: LogLevel; message: string }> = [];
  
  log(level: LogLevel, formattedMessage: string): void {
    this.logs.push({ level, message: formattedMessage });
  }
  
  clear(): void {
    this.logs = [];
  }
}

describe('LoggerService', () => {
  let logger: LoggerService;
  let mockDestination: MockDestination;
  
  beforeEach(() => {
    // Rensa alla tidigare instanser och återställ singleton
    // @ts-ignore: Använder privata egenskaper i test
    LoggerService.instance = undefined;
    
    // Skapa en ny logger med vår mock-destination
    logger = LoggerService.getInstance({ minLevel: LogLevel.DEBUG });
    mockDestination = new MockDestination();
    
    // Rensa logger och lägg till vår mock
    // @ts-ignore: Använder privata metoder i test
    logger.clearDestinations();
    // @ts-ignore: Använder privata metoder i test
    logger.addDestination(mockDestination);
  });
  
  afterEach(() => {
    mockDestination.clear();
  });
  
  it('ska logga debug-meddelanden', () => {
    const message = 'Detta är ett debug-meddelande';
    logger.debug(message);
    
    expect(mockDestination.logs.length).toBe(1);
    expect(mockDestination.logs[0].level).toBe(LogLevel.DEBUG);
    expect(mockDestination.logs[0].message).toContain(message);
  });
  
  it('ska logga info-meddelanden', () => {
    const message = 'Detta är ett info-meddelande';
    logger.info(message);
    
    expect(mockDestination.logs.length).toBe(1);
    expect(mockDestination.logs[0].level).toBe(LogLevel.INFO);
    expect(mockDestination.logs[0].message).toContain(message);
  });
  
  it('ska logga warning-meddelanden', () => {
    const message = 'Detta är ett varningsmeddelande';
    logger.warning(message);
    
    expect(mockDestination.logs.length).toBe(1);
    expect(mockDestination.logs[0].level).toBe(LogLevel.WARNING);
    expect(mockDestination.logs[0].message).toContain(message);
  });
  
  it('ska logga error-meddelanden', () => {
    const message = 'Detta är ett felmeddelande';
    logger.error(message);
    
    expect(mockDestination.logs.length).toBe(1);
    expect(mockDestination.logs[0].level).toBe(LogLevel.ERROR);
    expect(mockDestination.logs[0].message).toContain(message);
  });
  
  it('ska logga critical-meddelanden', () => {
    const message = 'Detta är ett kritiskt felmeddelande';
    logger.critical(message);
    
    expect(mockDestination.logs.length).toBe(1);
    expect(mockDestination.logs[0].level).toBe(LogLevel.CRITICAL);
    expect(mockDestination.logs[0].message).toContain(message);
  });
  
  it('ska respektera minsta loggnivå', () => {
    // @ts-ignore: Använder privata egenskaper i test
    LoggerService.instance = undefined;
    logger = LoggerService.getInstance({ minLevel: LogLevel.WARNING });
    
    mockDestination = new MockDestination();
    // @ts-ignore: Använder privata metoder i test
    logger.clearDestinations();
    // @ts-ignore: Använder privata metoder i test
    logger.addDestination(mockDestination);
    
    logger.debug('Detta ska inte loggas');
    logger.info('Detta ska inte heller loggas');
    logger.warning('Detta ska loggas');
    logger.error('Detta ska också loggas');
    
    expect(mockDestination.logs.length).toBe(2);
    expect(mockDestination.logs[0].level).toBe(LogLevel.WARNING);
    expect(mockDestination.logs[1].level).toBe(LogLevel.ERROR);
  });
  
  it('ska inkludera kontext i loggmeddelanden', () => {
    const message = 'Meddelande med kontext';
    const context = { userId: '123', action: 'test' };
    
    logger.info(message, context);
    
    expect(mockDestination.logs.length).toBe(1);
    expect(mockDestination.logs[0].message).toContain(message);
    expect(mockDestination.logs[0].message).toContain('"userId":"123"');
    expect(mockDestination.logs[0].message).toContain('"action":"test"');
  });
  
  it('ska spåra händelser', () => {
    const eventName = 'button_click';
    const properties = { buttonId: 'submit', screen: 'login' };
    
    // Skapa en mock analytics callback
    const mockAnalytics = jest.fn();
    
    // @ts-ignore: Använder privata egenskaper i test
    LoggerService.instance = undefined;
    logger = LoggerService.getInstance({
      minLevel: LogLevel.DEBUG,
      analyticsCallback: mockAnalytics
    });
    
    // @ts-ignore: Använder privata metoder i test
    logger.clearDestinations();
    // @ts-ignore: Använder privata metoder i test
    logger.addDestination(mockDestination);
    
    logger.trackEvent(eventName, properties);
    
    // Verifiera att analyticsCallback anropades
    expect(mockAnalytics).toHaveBeenCalledWith(eventName, properties);
    
    // Verifiera att händelsen loggades
    expect(mockDestination.logs.length).toBe(1);
    expect(mockDestination.logs[0].message).toContain(eventName);
    expect(mockDestination.logs[0].message).toContain('"buttonId":"submit"');
  });
  
  it('ska vara en singleton', () => {
    const anotherLogger = LoggerService.getInstance();
    expect(anotherLogger).toBe(logger);
  });
  
  it('ska kunna stänga av loggning', () => {
    // @ts-ignore: Använder privata metoder i test
    logger.disableLogging();
    
    logger.debug('Detta ska inte loggas');
    logger.info('Detta ska inte loggas');
    logger.warning('Detta ska inte loggas');
    logger.error('Detta ska inte loggas');
    logger.critical('Detta ska inte loggas');
    
    expect(mockDestination.logs.length).toBe(0);
    
    // @ts-ignore: Använder privata metoder i test
    logger.enableLogging();
    
    logger.info('Detta ska loggas igen');
    expect(mockDestination.logs.length).toBe(1);
  });
}); 