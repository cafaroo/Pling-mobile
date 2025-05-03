/**
 * Standardiserad svarstyp för alla service-funktioner
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type TeamServiceResponse<T> = ServiceResponse<T>; 