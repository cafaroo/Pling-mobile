import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamError } from '../errors/TeamError';

export class TeamName extends ValueObject<string> {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 50;

  private constructor(value: string) {
    super(value);
  }

  public static create(name: string): Result<TeamName, TeamError> {
    if (!name || name.trim().length < this.MIN_LENGTH) {
      return err(new TeamError.NameTooShort());
    }

    if (name.length > this.MAX_LENGTH) {
      return err(new TeamError.NameTooLong());
    }

    return ok(new TeamName(name.trim()));
  }
} 