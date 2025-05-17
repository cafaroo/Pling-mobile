/**
 * CreateTeamUseCase
 * 
 * Use case för att skapa ett nytt team
 */

import { Result, ok, err } from '@/shared/core/Result';
import { Team } from '@/domain/team/entities/Team';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { EventBus } from '@/shared/core/EventBus';
import { UniqueEntityID } from '@/domain/core/UniqueEntityID';
import { TeamSettings } from '@/domain/team/value-objects/TeamSettings';
import { User } from '@/domain/user/entities/User';

export interface CreateTeamDTO {
  name: string;
  description?: string;
  ownerId: string;
  organizationId: string;
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
      canInviteMembers?: string[];
      canRemoveMembers?: string[];
      canManageSettings?: string[];
    }
  };
}

export class CreateTeamUseCase {
  private teamRepository: TeamRepository;
  private eventBus: EventBus;

  constructor(teamRepository: TeamRepository, eventBus: EventBus) {
    this.teamRepository = teamRepository;
    this.eventBus = eventBus;
  }

  static create(teamRepository: TeamRepository, eventBus: EventBus): CreateTeamUseCase {
    return new CreateTeamUseCase(teamRepository, eventBus);
  }

  async execute(dto: CreateTeamDTO): Promise<Result<Team, Error>> {
    try {
      // Skapa inställningar för teamet
      const settingsResult = TeamSettings.create({
        notificationSettings: {
          newMembers: dto.settings?.notificationSettings?.newMembers ?? true,
          memberLeft: dto.settings?.notificationSettings?.memberLeft ?? true,
          roleChanges: dto.settings?.notificationSettings?.roleChanges ?? true,
          activityUpdates: dto.settings?.notificationSettings?.activityUpdates ?? true
        },
        communications: {
          allowDirectMessages: dto.settings?.communications?.allowDirectMessages ?? true,
          allowMentions: dto.settings?.communications?.allowMentions ?? true
        },
        permissions: {
          canInviteMembers: dto.settings?.permissions?.canInviteMembers ?? ['owner', 'admin'],
          canRemoveMembers: dto.settings?.permissions?.canRemoveMembers ?? ['owner', 'admin'],
          canManageSettings: dto.settings?.permissions?.canManageSettings ?? ['owner', 'admin']
        }
      });

      if (settingsResult.isErr()) {
        return err(new Error(`Kunde inte skapa teaminställningar: ${settingsResult.error}`));
      }

      // Skapa ett team med de angivna parametrarna
      const teamResult = Team.create({
        name: dto.name,
        description: dto.description || '',
        ownerId: dto.ownerId,
        members: [{ 
          userId: dto.ownerId,
          role: 'owner',
          joinedAt: new Date()
        }],
        organizationId: dto.organizationId,
        settings: settingsResult.value,
        active: true
      }, new UniqueEntityID());

      if (teamResult.isErr()) {
        return err(new Error(`Kunde inte skapa team: ${teamResult.error}`));
      }

      const team = teamResult.value;

      // Spara teamet i repositoryt
      const saveResult = await this.teamRepository.save(team);
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara team: ${saveResult.error}`));
      }

      // Publicera alla domänhändelser
      const events = team.getDomainEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      
      team.clearEvents();
      
      return ok(team);
    } catch (error) {
      return err(
        error instanceof Error 
          ? error 
          : new Error('Ett okänt fel uppstod vid skapande av team')
      );
    }
  }
}

export default function createTeam(deps: {
  teamRepository: TeamRepository;
  eventBus: EventBus;
}) {
  const { teamRepository, eventBus } = deps;
  const useCase = new CreateTeamUseCase(teamRepository, eventBus);
  
  return (dto: CreateTeamDTO): Promise<Result<Team, Error>> => {
    return useCase.execute(dto);
  };
} 