/**
 * UniqueEntityID representerar en unik identifierare för entiteter.
 * Denna klass är särskilt användbar för domänentiteter som kräver unika ID.
 */

import { v4 as uuidv4 } from 'uuid';

export class UniqueEntityID {
  private readonly value: string;

  /**
   * Skapar en ny UniqueEntityID. Om inget ID anges, genereras ett UUID.
   * @param id Valfritt ID att använda, annars genereras ett UUID
   */
  constructor(id?: string) {
    this.value = id || uuidv4();
  }

  /**
   * Returnerar ID:t som en sträng
   */
  toString(): string {
    return this.value;
  }

  /**
   * Returnerar ID:t som en sträng
   */
  toValue(): string {
    return this.value;
  }

  /**
   * Jämför om två UniqueEntityID är lika
   * @param id ID att jämföra med
   */
  equals(id?: UniqueEntityID): boolean {
    if (!id) {
      return false;
    }
    
    return this.value === id.value;
  }

  /**
   * Skapar en ny UniqueEntityID från ett befintligt ID
   * @param id Befintligt ID att konvertera från
   */
  static create(id?: string): UniqueEntityID {
    return new UniqueEntityID(id);
  }
}

export default UniqueEntityID; 