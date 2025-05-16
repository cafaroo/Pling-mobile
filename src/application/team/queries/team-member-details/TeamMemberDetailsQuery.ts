import { Result, ok, err } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';
import { User } from '@/domain/user/entities/User';

export interface TeamMemberDetailsParams {
  teamId: string;
  includeInactive?: boolean;
  includeMemberActivity?: boolean;
  includeProfileDetails?: boolean;
}

export interface MemberActivitySummary {
  activitiesCount: number;
  lastActivityDate?: string;
  joinedTeamAt: string;
  averageActivitiesPerWeek: number;
}

export interface TeamMemberDetailDTO {
  userId: string;
  teamId: string;
  role: string;
  joinedAt: string;
  isActive: boolean;
  // User data
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  // Extended profile data (optional)
  bio?: string;
  location?: string;
  skills?: string[];
  // Activity data (optional)
  activitySummary?: MemberActivitySummary;
}

export interface TeamMemberDetailsResult {
  members: TeamMemberDetailDTO[];
  team: {
    id: string;
    name: string;
    ownerId: string;
  };
  total: number;
}

/**
 * TeamMemberDetailsQuery
 * 
 * En specialiserad query för att hämta detaljerad information om teammedlemmar
 * genom att kombinera data från team- och användarrepositorier.
 */
export class TeamMemberDetailsQuery {
  constructor(
    private teamRepository: TeamRepository,
    private userRepository: UserRepository
  ) {}

  /**
   * Utför hämtning av detaljer om teammedlemmar
   */
  async execute(params: TeamMemberDetailsParams): Promise<Result<TeamMemberDetailsResult, string>> {
    try {
      if (!params.teamId) {
        return err('teamId är obligatoriskt');
      }

      const teamId = new UniqueId(params.teamId);
      
      // Hämta team-information
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(`Kunde inte hämta team: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      if (!team) {
        return err(`Teamet hittades inte`);
      }
      
      // Hämta medlemmar
      const membersResult = await this.teamRepository.getMembers(teamId);
      
      if (membersResult.isErr()) {
        return err(`Kunde inte hämta teammedlemmar: ${membersResult.error}`);
      }
      
      const members = membersResult.value;
      
      // Filtrera bort inaktiva medlemmar om så önskas
      const filteredMembers = params.includeInactive 
        ? members 
        : members.filter(member => member.isActive);
      
      // Hämta användarinformation för varje medlem
      const memberDetails = await this.getMembersWithUserDetails(
        teamId, 
        filteredMembers, 
        params.includeProfileDetails,
        params.includeMemberActivity
      );
      
      if (memberDetails.isErr()) {
        return err(`Kunde inte hämta användarinformation för teammedlemmar: ${memberDetails.error}`);
      }
      
      return ok({
        members: memberDetails.value,
        team: {
          id: team.id.toString(),
          name: team.name,
          ownerId: team.ownerId.toString()
        },
        total: memberDetails.value.length
      });
    } catch (error) {
      return err(`Ett fel inträffade vid hämtning av teammedlemmar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Hjälpmetod för att hämta detaljerad information om teammedlemmar
   */
  private async getMembersWithUserDetails(
    teamId: UniqueId, 
    members: TeamMember[],
    includeProfileDetails: boolean = false,
    includeMemberActivity: boolean = false
  ): Promise<Result<TeamMemberDetailDTO[], string>> {
    try {
      // Hämta användar-IDs
      const userIds = members.map(member => member.userId);
      
      // Hämta användardata
      const usersResult = await this.userRepository.findByIds(userIds);
      
      if (usersResult.isErr()) {
        return err(`Kunde inte hämta användarinformation: ${usersResult.error}`);
      }
      
      const users = usersResult.value;
      
      // Skapa en map för snabb åtkomst av användardata
      const userMap = new Map<string, User>();
      users.forEach(user => userMap.set(user.id.toString(), user));
      
      // Kombinera team-medlemsdata med användardata
      const memberDetails: TeamMemberDetailDTO[] = [];
      
      for (const member of members) {
        const user = userMap.get(member.userId.toString());
        
        if (!user) {
          // Hoppa över medlemmen om vi inte kunde hitta användardata
          continue;
        }
        
        // Grundläggande medlemsinformation
        const memberDetail: TeamMemberDetailDTO = {
          userId: member.userId.toString(),
          teamId: teamId.toString(),
          role: member.role,
          joinedAt: member.joinedAt.toISOString(),
          isActive: member.isActive,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          email: user.email.value,
          profileImageUrl: user.profile.avatarUrl
        };
        
        // Lägg till utökad profilinformation om det efterfrågas
        if (includeProfileDetails) {
          memberDetail.bio = user.profile.bio;
          memberDetail.location = user.profile.location;
          memberDetail.skills = user.profile.skills;
        }
        
        // Lägg till aktivitetsdata om det efterfrågas
        if (includeMemberActivity) {
          const activitySummary = await this.getMemberActivitySummary(teamId, member.userId);
          
          if (activitySummary.isOk()) {
            memberDetail.activitySummary = activitySummary.value;
          }
        }
        
        memberDetails.push(memberDetail);
      }
      
      return ok(memberDetails);
    } catch (error) {
      return err(`Ett fel inträffade vid hämtning av användarinformation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Hjälpmetod för att hämta aktivitetssummering för en medlem
   */
  private async getMemberActivitySummary(
    teamId: UniqueId, 
    userId: UniqueId
  ): Promise<Result<MemberActivitySummary, string>> {
    try {
      // Hämta medlem
      const memberResult = await this.teamRepository.getMember(teamId, userId);
      
      if (memberResult.isErr()) {
        return err(`Kunde inte hämta medlemsinformation: ${memberResult.error}`);
      }
      
      const member = memberResult.value;
      
      if (!member) {
        return err('Medlemmen hittades inte');
      }
      
      // Simulerar hämtning av aktivitetsdata 
      // I en verklig implementation skulle detta hämtas från en aktivitetsrepository
      const joinedDate = member.joinedAt;
      const now = new Date();
      const weeksInTeam = Math.max(1, Math.floor((now.getTime() - joinedDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
      
      // Simulerade värden
      const activitiesCount = Math.floor(Math.random() * 100);
      const lastActivityDate = new Date(now.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
      
      return ok({
        activitiesCount,
        lastActivityDate: lastActivityDate.toISOString(),
        joinedTeamAt: joinedDate.toISOString(),
        averageActivitiesPerWeek: activitiesCount / weeksInTeam
      });
    } catch (error) {
      return err(`Ett fel inträffade vid hämtning av medlemsaktivitet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 