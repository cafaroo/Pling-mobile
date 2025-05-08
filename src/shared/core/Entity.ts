import { UniqueId } from './UniqueId';

export interface EntityProps {
  id: UniqueId;
}

export abstract class Entity<T extends EntityProps> {
  protected readonly props: T;

  get id(): UniqueId {
    return this.props.id;
  }

  protected constructor(props: T) {
    this.props = props;
  }

  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!(entity instanceof Entity)) {
      return false;
    }

    return this.id.equals(entity.id);
  }
} 