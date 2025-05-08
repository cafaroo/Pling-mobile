interface ValueObjectProps {
  [index: string]: any;
}

/**
 * ValueObject är en basklass för alla värdesobjekt i domänen.
 * Ett värdesobjekt är ett objekt som identifieras av sina attribut snarare än sin identitet.
 */
export abstract class ValueObject<T extends ValueObjectProps> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
} 