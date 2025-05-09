import { Result, ok } from '@/shared/core/Result';

/**
 * Mock för TeamSettings för användning i tester
 * 
 * Denna mock implementerar alla nödvändiga metoder som används i Team-entiteten
 * och andra delar av applikationen.
 */
export class TeamSettings {
  constructor(private readonly props: any = {}) {}

  static create(props: any = {}): Result<TeamSettings, string> {
    return ok(new TeamSettings({
      isPrivate: props.isPrivate ?? true,
      requiresApproval: props.requiresApproval ?? true,
      maxMembers: props.maxMembers ?? 50,
      allowGuests: props.allowGuests ?? false,
      notificationSettings: props.notificationSettings ?? {
        newMembers: true,
        memberLeft: true,
        roleChanges: true,
        activityUpdates: true
      }
    }));
  }

  /**
   * Uppdaterar inställningarna med nya värden
   */
  update(patch: any): TeamSettings {
    return new TeamSettings({
      ...this.props,
      ...patch
    });
  }

  /**
   * Konverterar inställningarna till ett JSON-objekt för persistens
   */
  toJSON(): any {
    return {
      is_private: this.props.isPrivate,
      requires_approval: this.props.requiresApproval,
      max_members: this.props.maxMembers,
      allow_guests: this.props.allowGuests,
      notification_settings: {
        new_members: this.props.notificationSettings?.newMembers,
        member_left: this.props.notificationSettings?.memberLeft,
        role_changes: this.props.notificationSettings?.roleChanges,
        activity_updates: this.props.notificationSettings?.activityUpdates
      }
    };
  }

  /**
   * Hjälpmetoder för att hämta inställningar
   */
  get isPrivate(): boolean {
    return this.props.isPrivate ?? true;
  }

  get requiresApproval(): boolean {
    return this.props.requiresApproval ?? true;
  }

  get maxMembers(): number | undefined {
    return this.props.maxMembers;
  }

  get allowGuests(): boolean {
    return this.props.allowGuests ?? false;
  }

  get notificationSettings(): any {
    return this.props.notificationSettings ?? {};
  }
}

// Exportera en fördefinierad instans för enkel användning
export const mockTeamSettings = new TeamSettings({
  isPrivate: true,
  requiresApproval: true,
  maxMembers: 50,
  allowGuests: false,
  notificationSettings: {
    newMembers: true,
    memberLeft: true,
    roleChanges: true,
    activityUpdates: true
  }
}); 