import { ValueObject } from '@/shared/core/ValueObject';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

interface TeamInvitationProps {
  userId: UniqueId;
  invitedBy: UniqueId;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  respondedAt?: Date;
}

export class TeamInvitation extends ValueObject<TeamInvitationProps> {
  private constructor(props: TeamInvitationProps) {
    super(props);
  }

  public static create(props: Omit<TeamInvitationProps, 'createdAt' | 'status'>): Result<TeamInvitation, string> {
    if (!props.userId) {
      return Result.err('Användare krävs');
    }

    if (!props.invitedBy) {
      return Result.err('Inbjudare krävs');
    }

    if (props.expiresAt < new Date()) {
      return Result.err('Utgångsdatum måste vara i framtiden');
    }

    return Result.ok(new TeamInvitation({
      ...props,
      status: 'pending',
      createdAt: new Date()
    }));
  }

  public get userId(): UniqueId {
    return this.props.userId;
  }

  public get invitedBy(): UniqueId {
    return this.props.invitedBy;
  }

  public get status(): InvitationStatus {
    return this.props.status;
  }

  public get expiresAt(): Date {
    return this.props.expiresAt;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get respondedAt(): Date | undefined {
    return this.props.respondedAt;
  }

  public isExpired(): boolean {
    return this.props.expiresAt < new Date();
  }

  public isPending(): boolean {
    return this.props.status === 'pending' && !this.isExpired();
  }

  public accept(): Result<TeamInvitation, string> {
    if (this.isExpired()) {
      return Result.err('Inbjudan har gått ut');
    }

    if (!this.isPending()) {
      return Result.err('Inbjudan är inte väntande');
    }

    return Result.ok(new TeamInvitation({
      ...this.props,
      status: 'accepted',
      respondedAt: new Date()
    }));
  }

  public decline(): Result<TeamInvitation, string> {
    if (!this.isPending()) {
      return Result.err('Inbjudan är inte väntande');
    }

    return Result.ok(new TeamInvitation({
      ...this.props,
      status: 'declined',
      respondedAt: new Date()
    }));
  }
} 