import { UniqueId } from '../domain/UniqueId';

export abstract class Entity<T> {
  protected readonly props: T;
  protected readonly id: UniqueId;

  constructor(props: T, id?: UniqueId) {
    this.props = props;
    this.id = id || new UniqueId();
  }

  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this.id.equals(entity.id);
  }

  public getId(): UniqueId {
    return this.id;
  }
} 