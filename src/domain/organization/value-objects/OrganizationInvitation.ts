import { ValueObject } from '@/shared/core/ValueObject';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface OrganizationInvitationProps {
  id?: UniqueId;
  organizationId: UniqueId;
  userId: UniqueId;
  invitedBy: UniqueId;
  email?: string;
  status: InvitationStatus;
  expiresAt?: Date;
  createdAt: Date;
  respondedAt?: Date;
}

export class OrganizationInvitation extends ValueObject<OrganizationInvitationProps> {
  private constructor(props: OrganizationInvitationProps) {
    super(props);
  }

  get id(): UniqueId {
    return this.props.id ?? new UniqueId();
  }

  get organizationId(): UniqueId {
    return this.props.organizationId;
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

  public isPending(): boolean {
    return this.props.status === 'pending';
  }

  public isAccepted(): boolean {
    return this.props.status === 'accepted';
  }

  public isDeclined(): boolean {
    return this.props.status === 'declined';
  }

  public isExpired(): boolean {
    if (this.props.status === 'expired') return true;
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  public accept(): Result<OrganizationInvitation, string> {
    if (this.isExpired()) {
      return err('Inbjudan har löpt ut');
    }
    
    if (!this.isPending()) {
      return err('Inbjudan är inte i väntande status');
    }

    return ok(new OrganizationInvitation({
      ...this.props,
      status: 'accepted',
      respondedAt: new Date()
    }));
  }

  public decline(): Result<OrganizationInvitation, string> {
    if (this.isExpired()) {
      return err('Inbjudan har löpt ut');
    }
    
    if (!this.isPending()) {
      return err('Inbjudan är inte i väntande status');
    }

    return ok(new OrganizationInvitation({
      ...this.props,
      status: 'declined',
      respondedAt: new Date()
    }));
  }

  public expire(): Result<OrganizationInvitation, string> {
    if (!this.isPending()) {
      return err('Endast väntande inbjudningar kan markeras som utgångna');
    }

    return ok(new OrganizationInvitation({
      ...this.props,
      status: 'expired'
    }));
  }

  public static create(props: {
    id?: string | UniqueId;
    organizationId: string | UniqueId;
    userId: string | UniqueId;
    invitedBy: string | UniqueId;
    email?: string;
    status?: InvitationStatus;
    expiresAt?: Date;
    createdAt?: Date;
    respondedAt?: Date;
  }): Result<OrganizationInvitation, string> {
    try {
      // Validera e-post om sådan finns
      if (props.email && !props.email.includes('@')) {
        return err('Ogiltig e-postadress');
      }

      // Konvertera ID:n till UniqueId-instanser
      const id = props.id 
        ? (props.id instanceof UniqueId ? props.id : new UniqueId(props.id))
        : new UniqueId();

      const organizationId = props.organizationId instanceof UniqueId
        ? props.organizationId
        : new UniqueId(props.organizationId);

      const userId = props.userId instanceof UniqueId
        ? props.userId
        : new UniqueId(props.userId);

      const invitedBy = props.invitedBy instanceof UniqueId
        ? props.invitedBy
        : new UniqueId(props.invitedBy);

      // Skapa standardutgångsdatum om inget angivits (7 dagar framåt)
      const now = props.createdAt ? new Date(props.createdAt) : new Date();
      const expiresAt = props.expiresAt ? new Date(props.expiresAt) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Skapa värdesobjektet
      return ok(new OrganizationInvitation({
        id,
        organizationId,
        userId,
        invitedBy,
        email: props.email,
        status: props.status || 'pending',
        expiresAt,
        createdAt: now,
        respondedAt: props.respondedAt ? new Date(props.respondedAt) : undefined
      }));
    } catch (error) {
      return err(`Kunde inte skapa organisationsinbjudan: ${error.message}`);
    }
  }
} 