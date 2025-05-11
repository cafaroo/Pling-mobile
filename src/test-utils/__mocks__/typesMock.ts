/**
 * Mock för typmoduler som används i tester
 * 
 * Detta används för att lösa importproblem för @types/shared och liknande
 */

// Definiera UniqueId direkt i mockfilen istället för att importera
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

// Mock för Result-interface som används i många tester
export const mockOk = <T>(value: T) => ({
  isOk: () => true,
  isError: () => false,
  value
});

export const mockError = <E = Error>(error: E) => ({
  isOk: () => false,
  isError: () => true,
  error
});

// Exportera mockade typer för att undvika importfel
export default {
  UniqueId,
  mockOk,
  mockError
}; 