import { Result } from '@/shared/core/Result';
import { Team } from './Team';
import { TeamMember } from '../value-objects/TeamMember';
import { TeamRole, TeamRoleEnum } from '../value-objects/TeamRole';
import { TeamName } from '../value-objects/TeamName';
import { TeamDescription } from '../value-objects/TeamDescription';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamSettings } from '../value-objects/TeamSettings';

/**
 * Interface för parametrar som behövs för att skapa ett team
 */
export interface CreateTeamParams {
  name: string;
  description?: string;
  ownerId: string;
  organizationId?: string | null; // Kan vara null om teamet inte är kopplat till en organisation
  members?: {
    userId: string;
    role?: TeamRoleEnum;
  }[];
}

/**
 * Factory-klass för att skapa Team-instanser
 */
export class TeamFactory {
  /**
   * Skapar ett nytt team
   * 
   * @param id Team-ID (valfritt, skapas annars automatiskt)
   * @param name Teamets namn
   * @param description Teamets beskrivning
   * @param ownerId Ägarens ID
   * @param organizationId Organisations-ID (valfritt)
   * @param extraMembers Extra medlemmar (utöver ägaren)
   * @returns Resultat med Team eller felmeddelande
   */
  public static create(
    id: string | null,
    name: string,
    description: string, 
    ownerId: string,
    organizationId: string | null,
    extraMembers: { userId: string; role: TeamRoleEnum }[] = []
  ): Result<Team, string> {
    try {
      // Skapa värde-objekt för namn och beskrivning
      const nameResult = TeamName.create(name);
      if (nameResult.isErr()) {
        return Result.fail(`Ogiltigt team-namn: ${nameResult.error}`);
      }
      
      const descriptionResult = TeamDescription.create(description);
      if (descriptionResult.isErr()) {
        return Result.fail(`Ogiltig team-beskrivning: ${descriptionResult.error}`);
      }
      
      // Skapa ägaren som medlem
      const ownerRoleResult = TeamRole.create(TeamRoleEnum.OWNER);
      if (ownerRoleResult.isErr()) {
        return Result.fail(`Kunde inte skapa ägarroll: ${ownerRoleResult.error}`);
      }
      
      const ownerMemberResult = TeamMember.create({
        userId: new UniqueId(ownerId),
        role: ownerRoleResult.value
      });
      
      if (ownerMemberResult.isErr()) {
        return Result.fail(`Kunde inte skapa ägarmedlem: ${ownerMemberResult.error}`);
      }
      
      // Skapa ytterligare medlemmar
      const members = [ownerMemberResult.value];
      
      for (const extraMember of extraMembers) {
        const roleResult = TeamRole.create(extraMember.role);
        if (roleResult.isErr()) {
          return Result.fail(`Kunde inte skapa medlemsroll: ${roleResult.error}`);
        }
        
        const memberResult = TeamMember.create({
          userId: new UniqueId(extraMember.userId),
          role: roleResult.value
        });
        
        if (memberResult.isErr()) {
          return Result.fail(`Kunde inte skapa medlem: ${memberResult.error}`);
        }
        
        members.push(memberResult.value);
      }
      
      // Skapa standardinställningar
      const settingsResult = TeamSettings.createDefault();
      if (settingsResult.isErr()) {
        return Result.fail(`Kunde inte skapa standardinställningar: ${settingsResult.error}`);
      }
      
      // Skapa team
      const now = new Date();
      const uniqueId = id ? new UniqueId(id) : new UniqueId();
      const orgId = organizationId ? new UniqueId(organizationId) : null;
      
      const team = new Team({
        id: uniqueId,
        name: nameResult.value,
        description: descriptionResult.value,
        ownerId: new UniqueId(ownerId),
        organizationId: orgId,
        members: members,
        settings: settingsResult.value,
        createdAt: now,
        updatedAt: now
      });
      
      return Result.ok(team);
    } catch (error) {
      return Result.fail(`Kunde inte skapa team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Skapar ett nytt team utan att validera värden (användbart i tester)
   * 
   * @param params Parametrar för att skapa ett team
   * @returns Ett Team-objekt
   */
  static createWithoutValidation(params: CreateTeamParams): Team {
    const result = this.create(
      null, 
      params.name, 
      params.description || '', 
      params.ownerId, 
      params.organizationId || null, 
      params.members?.map(m => ({ 
        userId: m.userId, 
        role: m.role || TeamRoleEnum.MEMBER 
      })) || []
    );
    
    if (result.isErr()) {
      throw new Error(`Kunde inte skapa team: ${result.error}`);
    }
    
    return result.value;
  }
} 