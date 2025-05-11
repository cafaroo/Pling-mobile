/**
 * Gemensamma typdefinitioner för hela applikationen
 */

/**
 * Representation av ett unikt ID i applikationen
 */
export class UniqueId {
  constructor(public readonly id: string | UniqueId) {
    if (id instanceof UniqueId) {
      this.id = id.id;
    }
  }

  toString(): string {
    return this.id.toString();
  }

  equals(other: UniqueId): boolean {
    return this.id === other.id;
  }
}

/**
 * Resultattyp som används för att hantera resultat med möjliga fel
 */
export type Result<T, E = Error> = 
  | { isOk: () => true; isError: () => false; value: T; error?: never }
  | { isOk: () => false; isError: () => true; value?: never; error: E };

/**
 * Standardiserat svarsformat från API-anrop
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Paginerade resultat
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Filtreringsalternativ för API-anrop
 */
export interface FilterOptions {
  [key: string]: string | number | boolean | string[] | null;
}

/**
 * Sorteringsalternativ för API-anrop
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
} 