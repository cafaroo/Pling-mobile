/**
 * UpdateTeamUseCase: Use case för att uppdatera ett teams egenskaper
 */

import { Result, ok, err } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { Team } from '@/domain/team/entities/Team';
import { EventBus } from '@/shared/core/EventBus';
import { TeamUpdatedEvent } from '@/domain/team/events/TeamUpdatedEvent';

// Input för uppdatering av team
export interface UpdateTeamInput {
  teamId: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  settings?: {
    notificationSettings?: {
      newMembers?: boolean;
      memberLeft?: boolean;
      roleChanges?: boolean;
      activityUpdates?: boolean;
    },
    communications?: {
      allowDirectMessages?: boolean;
      allowMentions?: boolean;
    },
    permissions?: {
      inviteMembers?: boolean;
      removeMembers?: boolean;
      changeRoles?: boolean;
    }
  };
}

// Dependencies för use caset
export interface UpdateTeamDeps {
  teamRepo: TeamRepository;
  eventBus: EventBus;
}

// Typ för use caset - byt namn från UpdateTeamUseCase till UpdateTeamUseCaseFunc
export type UpdateTeamUseCaseFunc = (input: UpdateTeamInput) => Promise<Result<Team, Error>>;

/**
 * Klassdefinition för UpdateTeamUseCase för bakåtkompatibilitet med tester
 * som förväntar sig en klass med constructor.
 * 
 * @deprecated Använd createUpdateTeamUseCase-funktionen istället
 */
export class UpdateTeamUseCase {
  private teamRepo: TeamRepository;
  private eventBus: EventBus;
  
  constructor(teamRepo: TeamRepository, eventBus: EventBus) {
    this.teamRepo = teamRepo;
    this.eventBus = eventBus;
  }
  
  async execute(input: UpdateTeamInput): Promise<Result<Team, Error>> {
    return createUpdateTeamUseCase({ 
      teamRepo: this.teamRepo, 
      eventBus: this.eventBus 
    })(input);
  }
}

/**
 * Skapar en UpdateTeamUseCase för att uppdatera ett teams egenskaper
 */
export const createUpdateTeamUseCase = (deps: UpdateTeamDeps): UpdateTeamUseCaseFunc => {
  const { teamRepo, eventBus } = deps;
  
  return async (input: UpdateTeamInput): Promise<Result<Team, Error>> => {
    try {
      const { teamId, ...updateData } = input;
      
      // Hämta teamet som ska uppdateras
      const teamResult = await teamRepo.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(new Error(`Team hittades inte`));
      }
      
      const team = teamResult.value;
      
      // Uppdatera teamegenskaper
      if (updateData.name) {
        // Validera namn
        if (!updateData.name.trim()) {
          return err(new Error('Ogiltigt teamnamn'));
        }
        
        const nameUpdateResult = team.updateName(updateData.name);
        if (nameUpdateResult.isErr()) {
          return err(new Error(`Kunde inte uppdatera teamnamn: ${nameUpdateResult.error}`));
        }
      }
      
      if (updateData.description !== undefined) {
        const descUpdateResult = team.updateDescription(updateData.description);
        if (descUpdateResult.isErr()) {
          return err(new Error(`Kunde inte uppdatera teambeskrivning: ${descUpdateResult.error}`));
        }
      }
      
      if (updateData.isActive !== undefined) {
        if (updateData.isActive) {
          team.activate();
        } else {
          team.deactivate();
        }
      }
      
      // Uppdatera inställningar om de finns
      if (updateData.settings) {
        const currentSettings = team.settings;
        
        // Uppdatera notifikationsinställningar
        if (updateData.settings.notificationSettings) {
          const updatedNotificationSettings = {
            ...currentSettings.notificationSettings,
            ...updateData.settings.notificationSettings
          };
          
          team.updateSettings({
            notificationSettings: updatedNotificationSettings
          });
        }
        
        // Uppdatera kommunikationsinställningar
        if (updateData.settings.communications) {
          const updatedCommunications = {
            ...currentSettings.communications,
            ...updateData.settings.communications
          };
          
          team.updateSettings({
            communications: updatedCommunications
          });
        }
        
        // Uppdatera behörighetsinställningar
        if (updateData.settings.permissions) {
          const updatedPermissions = {
            ...currentSettings.permissions,
            ...updateData.settings.permissions
          };
          
          team.updateSettings({
            permissions: updatedPermissions
          });
        }
      }
      
      // Spara teamet
      const saveResult = await teamRepo.save(team);
      
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte uppdatera team`));
      }
      
      // Publicera event för teamuppdatering
      const teamUpdatedEvent = new TeamUpdatedEvent({
        teamId: team.id.toString(),
        updatedFields: Object.keys(updateData)
      });
      
      eventBus.publish(teamUpdatedEvent);
      
      return ok(team);
    } catch (error) {
      return err(new Error('Ett oväntat fel inträffade'));
    }
  };
};

export default createUpdateTeamUseCase; 