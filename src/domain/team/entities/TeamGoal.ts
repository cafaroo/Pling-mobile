import { Result } from '@/domain/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';

export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled'
}

export interface GoalAssignment {
  userId: UniqueId;
  assignedAt: Date;
  role?: string;
}

export interface TeamGoalProps {
  id: UniqueId;
  teamId: UniqueId;
  title: string;
  description: string;
  startDate: Date;
  dueDate?: Date;
  status: GoalStatus;
  progress: number;
  createdBy: UniqueId;
  assignments: GoalAssignment[];
  createdAt: Date;
  updatedAt: Date;
}

export class TeamGoal {
  private constructor(private readonly props: TeamGoalProps) {}

  static create(props: TeamGoalProps): Result<TeamGoal, string> {
    if (!props.title.trim()) {
      return Result.err('Måltitel kan inte vara tom');
    }

    if (props.progress < 0 || props.progress > 100) {
      return Result.err('Framsteg måste vara mellan 0 och 100');
    }

    if (props.dueDate && props.startDate > props.dueDate) {
      return Result.err('Startdatum kan inte vara efter slutdatum');
    }

    return Result.ok(new TeamGoal(props));
  }

  get id(): UniqueId {
    return this.props.id;
  }

  get teamId(): UniqueId {
    return this.props.teamId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get startDate(): Date {
    return new Date(this.props.startDate);
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate ? new Date(this.props.dueDate) : undefined;
  }

  get status(): GoalStatus {
    return this.props.status;
  }

  get progress(): number {
    return this.props.progress;
  }

  get createdBy(): UniqueId {
    return this.props.createdBy;
  }

  get assignments(): GoalAssignment[] {
    return [...this.props.assignments];
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  updateProgress(progress: number): Result<void, string> {
    if (progress < 0 || progress > 100) {
      return Result.err('Framsteg måste vara mellan 0 och 100');
    }

    this.props.progress = progress;
    this.props.updatedAt = new Date();

    if (progress === 100 && this.status !== GoalStatus.COMPLETED) {
      this.props.status = GoalStatus.COMPLETED;
    } else if (progress < 100 && this.status === GoalStatus.COMPLETED) {
      this.props.status = GoalStatus.IN_PROGRESS;
    }

    return Result.ok(void 0);
  }

  updateStatus(status: GoalStatus): Result<void, string> {
    if (status === GoalStatus.COMPLETED && this.progress < 100) {
      return Result.err('Kan inte markera som slutfört när framsteg är mindre än 100%');
    }

    this.props.status = status;
    this.props.updatedAt = new Date();

    return Result.ok(void 0);
  }

  assignMember(userId: UniqueId, role?: string): Result<void, string> {
    if (this.props.assignments.some(a => a.userId.equals(userId))) {
      return Result.err('Medlemmen är redan tilldelad detta mål');
    }

    this.props.assignments.push({
      userId,
      assignedAt: new Date(),
      role
    });

    this.props.updatedAt = new Date();
    return Result.ok(void 0);
  }

  unassignMember(userId: UniqueId): Result<void, string> {
    const index = this.props.assignments.findIndex(a => a.userId.equals(userId));
    if (index === -1) {
      return Result.err('Medlemmen är inte tilldelad detta mål');
    }

    this.props.assignments.splice(index, 1);
    this.props.updatedAt = new Date();
    return Result.ok(void 0);
  }

  equals(other: TeamGoal): boolean {
    return this.id.equals(other.id);
  }
} 