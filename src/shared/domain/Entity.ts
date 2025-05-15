import { UniqueId } from '../core/UniqueId';

/**
 * Entity
 * 
 * Basklass för alla domänentiteter enligt DDD-principer.
 * En entitet är ett objekt som definieras av sin identitet snarare än sina attribut.
 */
export abstract class Entity<T> {
  protected readonly _id: UniqueId;
  protected props: T;

  constructor(props: T, id?: UniqueId) {
    this._id = id || new UniqueId();
    this.props = props;
  }

  /**
   * Returnerar entitetens unika ID
   */
  public get id(): UniqueId {
    return this._id;
  }

  /**
   * Jämför om denna entitet är samma som en annan entitet
   * @param entity Entiteten att jämföra med
   */
  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this._id.equals(entity._id);
  }
} 