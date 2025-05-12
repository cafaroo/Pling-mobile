/**
 * Robust felhanteringsmodul för Edge Functions
 */

// Standard CORS-headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Felklasser för olika typer av fel
export class WebhookError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'WebhookError';
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Åtkomst nekad') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  originalError: Error;
  
  constructor(message: string, originalError: Error) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

// Felkoder för olika typer av fel
export enum ErrorCode {
  // Stripe-relaterade fel
  STRIPE_SIGNATURE_MISSING = 'stripe_signature_missing',
  STRIPE_SIGNATURE_INVALID = 'stripe_signature_invalid',
  STRIPE_CONFIG_MISSING = 'stripe_config_missing',
  STRIPE_API_ERROR = 'stripe_api_error',
  
  // Schemalagda jobb-relaterade fel
  SCHEDULER_AUTH_FAILED = 'scheduler_auth_failed',
  UNKNOWN_JOB = 'unknown_job',
  JOB_EXECUTION_FAILED = 'job_execution_failed',
  
  // Databas-relaterade fel
  DATABASE_ERROR = 'database_error',
  RECORD_NOT_FOUND = 'record_not_found',
  
  // Allmänna fel
  VALIDATION_ERROR = 'validation_error',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  METHOD_NOT_ALLOWED = 'method_not_allowed'
}

// Loggning av fel med strukturerad information
export function logError(error: Error, context?: Record<string, any>): void {
  const errorData = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  };
  
  console.error('ERROR:', JSON.stringify(errorData));
}

// Standardiserad felrespons
export function createErrorResponse(
  error: Error, 
  statusCode = 500,
  errorCode = ErrorCode.INTERNAL_SERVER_ERROR
): Response {
  // Bestäm HTTP-statuskod baserat på feltyp
  if (error instanceof WebhookError) {
    statusCode = error.statusCode;
  } else if (error instanceof AuthenticationError) {
    statusCode = 403;
    errorCode = ErrorCode.SCHEDULER_AUTH_FAILED;
  } else if (error instanceof ValidationError) {
    statusCode = 400;
    errorCode = ErrorCode.VALIDATION_ERROR;
  }
  
  // Skapa standardiserad felrespons
  return new Response(
    JSON.stringify({
      error: {
        code: errorCode,
        message: error.message,
        // Inkludera aldrig stack trace i produktionsmiljö
        ...(Deno.env.get('ENVIRONMENT') === 'development' && { stack: error.stack })
      }
    }),
    {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Hjälpfunktion för att bygga tryFn högre ordningens funktion
export function tryCatchWrapper<T>(
  fn: () => Promise<T>,
  errorHandler: (error: Error) => Response
): Promise<T | Response> {
  return fn().catch(errorHandler);
}

// Hjälpfunktion för att skapa standardsvar
export function createSuccessResponse(data: any, statusCode = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Hjälpfunktion för validation
export function validateRequiredFields(
  obj: Record<string, any>, 
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => !obj[field]);
  if (missingFields.length > 0) {
    throw new ValidationError(`Följande fält saknas: ${missingFields.join(', ')}`);
  }
}

// Felspårningsfunktion för transaktioner
export async function withErrorTracking<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    console.log(`Operation '${operationName}' slutfördes på ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, { 
      operationName, 
      duration,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Tillåter ett begränsat antal försök (retry) för en funktion
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Försök ${attempt}/${maxRetries} misslyckades:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponentiell backoff med lite slumpmässighet
        const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
        const delay = delayMs * Math.pow(2, attempt - 1) * jitter;
        console.log(`Väntar ${Math.round(delay)}ms innan nästa försök...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Alla försök misslyckades');
} 