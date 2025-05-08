import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface TeamInvitationProps {
  id?: UniqueId;
  teamId: UniqueId;
  userId: UniqueId;
  invitedBy: UniqueId;
  email?: string;
  status: InvitationStatus;
  expiresAt?: Date;
  createdAt: Date;
  respondedAt?: Date;
}

export class TeamInvitation {
  private constructor(private readonly props: TeamInvitationProps) {}

  get id(): UniqueId {
    return this.props.id || new UniqueId();
  }

  get teamId(): UniqueId {
    return this.props.teamId;
  }

  get userId(): UniqueId {
    return this.props.userId;
  }

  get invitedBy(): UniqueId {
    return this.props.invitedBy;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get status(): InvitationStatus {
    return this.props.status;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt ? new Date(this.props.expiresAt) : undefined;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get respondedAt(): Date | undefined {
    return this.props.respondedAt ? new Date(this.props.respondedAt) : undefined;
  }

  get isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  public static create(props: TeamInvitationProps): Result<TeamInvitation, string> {
    try {
      // Validera obligatoriska fält
      if (!props.teamId || !props.userId || !props.invitedBy) {
        return err('TeamId, userId och invitedBy måste anges');
      }

      // Validera status
      const validStatuses = ['pending', 'accepted', 'declined', 'expired'];
      if (!validStatuses.includes(props.status)) {
        return err(`Ogiltig status: ${props.status}`);
      }

      // Validera datum
      if (props.expiresAt && !(props.expiresAt instanceof Date)) {
        return err('Ogiltigt utgångsdatum');
      }

      if (!(props.createdAt instanceof Date)) {
        return err('Ogiltigt skapandedatum');
      }

      if (props.respondedAt && !(props.respondedAt instanceof Date)) {
        return err('Ogiltigt svarsdatum');
      }

      // Validera svarsdatum
      if (props.respondedAt && props.status === 'pending') {
        return err('En väntande inbjudan kan inte ha ett svarsdatum');
      }

      if (props.status !== 'pending' && !props.respondedAt) {
        props.respondedAt = new Date();
      }

      // Skapa ett nytt ID om inget anges
      if (!props.id) {
        props.id = new UniqueId();
      }

      return ok(new TeamInvitation(props));
    } catch (error) {
      return err(`Kunde inte skapa teaminbjudan: ${error.message}`);
    }
  }

  public accept(): Result<TeamInvitation, string> {
    if (this.status !== 'pending') {
      return err('Kan bara acceptera väntande inbjudningar');
    }

    if (this.isExpired) {
      return err('Inbjudan har utgått');
    }

    return TeamInvitation.create({
      ...this.props,
      status: 'accepted',
      respondedAt: new Date()
    });
  }

  public decline(): Result<TeamInvitation, string> {
    if (this.status !== 'pending') {
      return err('Kan bara avböja väntande inbjudningar');
    }

    return TeamInvitation.create({
      ...this.props,
      status: 'declined',
      respondedAt: new Date()
    });
  }

  public expire(): Result<TeamInvitation, string> {
    if (this.status !== 'pending') {
      return err('Kan bara utgå väntande inbjudningar');
    }

    return TeamInvitation.create({
      ...this.props,
      status: 'expired',
      respondedAt: new Date()
    });
  }

  public toJSON() {
    return {
      id: this.id.toString(),
      teamId: this.teamId.toString(),
      userId: this.userId.toString(),
      invitedBy: this.invitedBy.toString(),
      email: this.email,
      status: this.status,
      expiresAt: this.expiresAt?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      respondedAt: this.respondedAt?.toISOString()
    };
  }
} 