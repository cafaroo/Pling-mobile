import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamError } from '../errors/TeamError';

export class TeamDescription extends ValueObject<string> {
  private static readonly MAX_LENGTH = 500;

  private constructor(value: string) {
    super(value);
  }

  public static create(description?: string): Result<TeamDescription | undefined, TeamError> {
    if (!description || description.trim().length === 0) {
      return ok(undefined);
    }

    if (description.length > this.MAX_LENGTH) {
      return err(new TeamError.DescriptionTooLong());
    }

    return ok(new TeamDescription(description.trim()));
  }
} 