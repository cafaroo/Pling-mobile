/**
 * ResultTestHelper
 * 
 * Hjälpfunktioner för att testa Result-objekt
 */

import { Result, ok, err } from '@/shared/core/Result';

export class ResultTestHelper {
  /**
   * Kontrollera om ett Result är ett ok-resultat
   */
  static isOk<T, E>(result: Result<T, E>): result is Result<T, E> & { value: T } {
    return result.isOk();
  }

  /**
   * Kontrollera om ett Result är ett err-resultat
   */
  static isErr<T, E>(result: Result<T, E>): result is Result<T, E> & { error: E } {
    return result.isErr();
  }

  /**
   * Skapa ett ok-resultat med det angivna värdet
   */
  static createOk<T, E = Error>(value: T): Result<T, E> {
    return ok(value);
  }

  /**
   * Skapa ett err-resultat med det angivna felvärdet
   */
  static createErr<T, E = Error>(error: E): Result<T, E> {
    return err(error);
  }

  /**
   * Kontrollera om ett resultat innehåller ett specifikt värde
   */
  static hasValue<T, E>(result: Result<T, E>, value: T): boolean {
    return result.isOk() && result.value === value;
  }

  /**
   * Kontrollera om ett resultat innehåller ett fel med specifikt meddelande
   */
  static hasErrorMessage<T>(result: Result<T, Error>, message: string): boolean {
    return result.isErr() && result.error.message === message;
  }

  /**
   * Kontrollera om ett resultat innehåller ett fel med ett specifikt felmeddelande.
   * För klass-baserade fel med message-egenskap.
   */
  static containsErrorMessage<T, E extends { message: string }>(
    result: Result<T, E>,
    substring: string
  ): boolean {
    return result.isErr() && result.error.message.includes(substring);
  }

  /**
   * Skapa ett okänt fel
   */
  static createUnknownError<T>(): Result<T, Error> {
    return err(new Error('Okänt fel'));
  }

  /**
   * Skapa ett databasfel
   */
  static createDatabaseError<T>(): Result<T, Error> {
    return err(new Error('Databasfel'));
  }

  /**
   * Skapa ett valideringsfel
   */
  static createValidationError<T>(): Result<T, Error> {
    return err(new Error('Valideringsfel'));
  }

  /**
   * Simulera en asynkron operation som lyckas
   */
  static async asyncOk<T, E>(value: T): Promise<Result<T, E>> {
    return ok(value);
  }

  /**
   * Simulera en asynkron operation som misslyckas
   */
  static async asyncErr<T, E>(error: E): Promise<Result<T, E>> {
    return err(error);
  }
} 