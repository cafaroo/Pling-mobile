import { Result, ok, err } from '@/shared/core/Result';
import { AggregateRoot } from '@/shared/core/AggregateRoot';
import { UniqueId } from '@/domain/core/UniqueId';

/**
 * TeamGoalProps beskriver egenskaper för ett team-mål.
 */
export interface TeamGoalProps {
  id: UniqueId;
  teamId: UniqueId;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  dueDate?: Date;
  status: GoalStatus;
  category: GoalCategory;
  assignedTo?: UniqueId[];
  createdBy: UniqueId;
  createdAt: Date;
  updatedAt: Date;
  milestones?: GoalMilestone[];
}

/**
 * Enum för status på mål.
 */
export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ARCHIVED = 'archived',
}

/**
 * Enum för mål-kategorier.
 */
export enum GoalCategory {
  HEALTH = 'health',
  FITNESS = 'fitness',
  PRODUCTIVITY = 'productivity',
  TEAM_BUILDING = 'team_building',
  LEARNING = 'learning',
  OTHER = 'other',
}

/**
 * Typ för milstolpe kopplad till ett mål.
 */
export interface GoalMilestone {
  id: UniqueId;
  goalId: UniqueId;
  title: string;
  targetValue?: number;
  isCompleted: boolean;
  dueDate?: Date;
  createdAt: Date;
}

/**
 * TeamGoal representerar ett mål för ett team.
 */
export class TeamGoal {
  public readonly props: TeamGoalProps;

  constructor(props: TeamGoalProps) {
    this.props = props;
  }

  /**
   * Skapa ett nytt team-mål.
   */
  static create(props: Omit<TeamGoalProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: UniqueId; createdAt?: Date; updatedAt?: Date }): TeamGoal {
    return new TeamGoal({
      ...props,
      id: props.id ?? new UniqueId(),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  /**
   * Uppdatera målstatus.
   */
  updateStatus(status: GoalStatus) {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  /**
   * Lägg till en milstolpe.
   */
  addMilestone(milestone: GoalMilestone) {
    if (!this.props.milestones) this.props.milestones = [];
    this.props.milestones.push(milestone);
    this.props.updatedAt = new Date();
  }

  /**
   * Uppdatera progress.
   */
  updateProgress(value: number) {
    this.props.currentValue = value;
    this.props.updatedAt = new Date();
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

  get description(): string | undefined {
    return this.props.description;
  }

  get targetValue(): number {
    return this.props.targetValue;
  }

  get currentValue(): number {
    return this.props.currentValue;
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

  get category(): GoalCategory {
    return this.props.category;
  }

  get assignedTo(): UniqueId[] | undefined {
    return this.props.assignedTo;
  }

  get createdBy(): UniqueId {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  get milestones(): GoalMilestone[] | undefined {
    return this.props.milestones;
  }

  updateProgress(progress: number): Result<void, string> {
    if (progress < 0 || progress > 100) {
      return err('Framsteg måste vara mellan 0 och 100');
    }

    this.props.currentValue = progress;
    this.props.updatedAt = new Date();

    if (progress === 100 && this.status !== GoalStatus.COMPLETED) {
      this.props.status = GoalStatus.COMPLETED;
    } else if (progress < 100 && this.status === GoalStatus.COMPLETED) {
      this.props.status = GoalStatus.ACTIVE;
    }

    return ok(void 0);
  }

  updateStatus(status: GoalStatus): Result<void, string> {
    if (status === GoalStatus.COMPLETED && this.currentValue < this.targetValue) {
      return err('Kan inte markera som slutfört när framsteg är mindre än 100%');
    }

    this.props.status = status;
    this.props.updatedAt = new Date();

    return ok(void 0);
  }

  assignMember(userId: UniqueId): Result<void, string> {
    if (this.props.assignedTo && this.props.assignedTo.includes(userId)) {
      return err('Medlemmen är redan tilldelad detta mål');
    }

    if (!this.props.assignedTo) this.props.assignedTo = [];
    this.props.assignedTo.push(userId);
    this.props.updatedAt = new Date();
    return ok(void 0);
  }

  unassignMember(userId: UniqueId): Result<void, string> {
    const index = this.props.assignedTo?.findIndex(u => u.equals(userId)) ?? -1;
    if (index === -1) {
      return err('Medlemmen är inte tilldelad detta mål');
    }

    this.props.assignedTo?.splice(index, 1);
    this.props.updatedAt = new Date();
    return ok(void 0);
  }

  equals(other: TeamGoal): boolean {
    return this.id.equals(other.id);
  }
} 