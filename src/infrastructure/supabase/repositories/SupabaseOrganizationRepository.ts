import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationMember } from '@/domain/organization/value-objects/OrganizationMember';
import { OrganizationInvitation } from '@/domain/organization/value-objects/OrganizationInvitation';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationMapper } from '../mappers/OrganizationMapper';
import { EventBus } from '@/infrastructure/events/EventBus';

export class SupabaseOrganizationRepository implements OrganizationRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus?: EventBus
  ) {}

  async findById(id: UniqueId): Promise<Result<Organization, string>> {
    try {
      // Hämta organisationen med medlemmar och inbjudningar
      const { data, error } = await this.supabase
        .from('organizations')
        .select(`
          *,
          members:organization_members(
            user_id,
            role,
            joined_at
          ),
          invitations:organization_invitations(
            id,
            user_id,
            invited_by,
            email,
            status,
            expires_at,
            created_at,
            responded_at
          )
        `)
        .eq('id', id.toString())
        .single();

      if (error) return err(error.message);
      if (!data) return err(`Organization med ID ${id.toString()} hittades inte`);

      // Hämta även team-IDs kopplade till organisationen
      const { data: teamData, error: teamError } = await this.supabase
        .from('team_organizations')
        .select('team_id')
        .eq('organization_id', id.toString());

      if (teamError) return err(teamError.message);

      // Kombinera data
      const organizationData = {
        ...data,
        team_ids: teamData?.map(item => item.team_id) || []
      };

      return ok(OrganizationMapper.toDomain(organizationData));
    } catch (error) {
      return err(`Fel vid hämtning av organisation: ${error.message}`);
    }
  }

  async findByOwnerId(ownerId: UniqueId): Promise<Result<Organization[], string>> {
    try {
      // Hämta organisationer där användaren är ägare
      const { data, error } = await this.supabase
        .from('organizations')
        .select(`
          *,
          members:organization_members(
            user_id,
            role,
            joined_at
          ),
          invitations:organization_invitations(
            id,
            user_id,
            invited_by,
            email,
            status,
            expires_at,
            created_at,
            responded_at
          )
        `)
        .eq('owner_id', ownerId.toString());

      if (error) return err(error.message);
      
      // Om inga data hittades, returnera tom array
      if (!data || data.length === 0) return ok([]);

      // Hämta team-IDs för varje organisation
      const organizationsWithTeams = await Promise.all(
        data.map(async (org) => {
          const { data: teamData } = await this.supabase
            .from('team_organizations')
            .select('team_id')
            .eq('organization_id', org.id);

          return {
            ...org,
            team_ids: teamData?.map(item => item.team_id) || []
          };
        })
      );

      return ok(organizationsWithTeams.map(OrganizationMapper.toDomain));
    } catch (error) {
      return err(`Fel vid hämtning av ägarens organisationer: ${error.message}`);
    }
  }

  async findByMemberId(userId: UniqueId): Promise<Result<Organization[], string>> {
    try {
      // Hämta organisationer där användaren är medlem
      const { data, error } = await this.supabase
        .from('organizations')
        .select(`
          *,
          members:organization_members(
            user_id,
            role,
            joined_at
          ),
          invitations:organization_invitations(
            id,
            user_id,
            invited_by,
            email,
            status,
            expires_at,
            created_at,
            responded_at
          )
        `)
        .eq('organization_members.user_id', userId.toString());

      if (error) return err(error.message);
      
      // Om inga data hittades, returnera tom array
      if (!data || data.length === 0) return ok([]);

      // Hämta team-IDs för varje organisation
      const organizationsWithTeams = await Promise.all(
        data.map(async (org) => {
          const { data: teamData } = await this.supabase
            .from('team_organizations')
            .select('team_id')
            .eq('organization_id', org.id);

          return {
            ...org,
            team_ids: teamData?.map(item => item.team_id) || []
          };
        })
      );

      return ok(organizationsWithTeams.map(OrganizationMapper.toDomain));
    } catch (error) {
      return err(`Fel vid hämtning av användarens organisationer: ${error.message}`);
    }
  }

  async findByTeamId(teamId: UniqueId): Promise<Result<Organization, string>> {
    try {
      // Hitta organisation kopplad till team
      const { data: linkData, error: linkError } = await this.supabase
        .from('team_organizations')
        .select('organization_id')
        .eq('team_id', teamId.toString())
        .single();

      if (linkError) return err(linkError.message);
      if (!linkData) return err(`Ingen organisation hittades för team ${teamId.toString()}`);

      // Hämta organisationen med medlemmar och inbjudningar
      const { data, error } = await this.supabase
        .from('organizations')
        .select(`
          *,
          members:organization_members(
            user_id,
            role,
            joined_at
          ),
          invitations:organization_invitations(
            id,
            user_id,
            invited_by,
            email,
            status,
            expires_at,
            created_at,
            responded_at
          )
        `)
        .eq('id', linkData.organization_id)
        .single();

      if (error) return err(error.message);
      if (!data) return err(`Organization med ID ${linkData.organization_id} hittades inte`);

      // Hämta alla team-IDs kopplade till organisationen
      const { data: teamData, error: teamError } = await this.supabase
        .from('team_organizations')
        .select('team_id')
        .eq('organization_id', linkData.organization_id);

      if (teamError) return err(teamError.message);

      // Kombinera data
      const organizationData = {
        ...data,
        team_ids: teamData?.map(item => item.team_id) || []
      };

      return ok(OrganizationMapper.toDomain(organizationData));
    } catch (error) {
      return err(`Fel vid hämtning av organisation för team: ${error.message}`);
    }
  }

  async save(organization: Organization): Promise<Result<void, string>> {
    try {
      // Bearbeta data för persistence
      const orgData = OrganizationMapper.toPersistence(organization);
      const { members, invitations, team_ids, ...organizationData } = orgData;

      // Använd en transaktion för att säkerställa att allt sparas korrekt
      const { error: orgError } = await this.supabase
        .from('organizations')
        .upsert(organizationData);

      if (orgError) return err(orgError.message);

      // Spara medlemmar
      if (members && members.length > 0) {
        // Ta först bort alla existerande medlemmar
        const { error: deleteError } = await this.supabase
          .from('organization_members')
          .delete()
          .eq('organization_id', organization.id.toString());

        if (deleteError) return err(deleteError.message);

        // Lägg sedan till de aktuella medlemmarna
        const { error: membersError } = await this.supabase
          .from('organization_members')
          .insert(members);

        if (membersError) return err(membersError.message);
      }

      // Spara inbjudningar
      if (invitations && invitations.length > 0) {
        // Vi hanterar inbjudningar mer försiktigt än medlemmar eftersom de kan ha status
        // Hämta först befintliga inbjudningar
        const { data: existingInvitations, error: fetchInvError } = await this.supabase
          .from('organization_invitations')
          .select('id, status')
          .eq('organization_id', organization.id.toString());

        if (fetchInvError) return err(fetchInvError.message);

        // Filtrera bort inbjudningar vi vill uppdatera vs. lägga till
        const existingIds = existingInvitations ? existingInvitations.map(inv => inv.id) : [];
        const invitationsToUpdate = invitations.filter(inv => existingIds.includes(inv.id));
        const invitationsToInsert = invitations.filter(inv => !existingIds.includes(inv.id));

        // Uppdatera befintliga inbjudningar
        if (invitationsToUpdate.length > 0) {
          const { error: updateInvError } = await this.supabase
            .from('organization_invitations')
            .upsert(invitationsToUpdate);

          if (updateInvError) return err(updateInvError.message);
        }

        // Lägg till nya inbjudningar
        if (invitationsToInsert.length > 0) {
          const { error: insertInvError } = await this.supabase
            .from('organization_invitations')
            .insert(invitationsToInsert);

          if (insertInvError) return err(insertInvError.message);
        }
      }

      // Hantera team-kopplingar
      if (team_ids && team_ids.length > 0) {
        // Ta bort existerande kopplingar
        const { error: deleteTeamError } = await this.supabase
          .from('team_organizations')
          .delete()
          .eq('organization_id', organization.id.toString());

        if (deleteTeamError) return err(deleteTeamError.message);

        // Lägg till aktuella team-kopplingar
        const teamLinks = team_ids.map(teamId => ({
          organization_id: organization.id.toString(),
          team_id: teamId
        }));

        const { error: teamLinkError } = await this.supabase
          .from('team_organizations')
          .insert(teamLinks);

        if (teamLinkError) return err(teamLinkError.message);
      }

      // Publicera domänhändelser om EventBus finns
      if (this.eventBus) {
        organization.domainEvents.forEach(event => {
          this.eventBus?.publish(event);
        });
        organization.clearEvents();
      }
      
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid sparande av organisation: ${error.message}`);
    }
  }

  async delete(id: UniqueId): Promise<Result<void, string>> {
    try {
      // Ta bort organisationen
      const { error } = await this.supabase
        .from('organizations')
        .delete()
        .eq('id', id.toString());

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av organisation: ${error.message}`);
    }
  }

  async exists(id: UniqueId): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('id', id.toString())
        .single();

      if (error || !data) return false;
      return true;
    } catch (error) {
      return false;
    }
  }

  async findInvitationsByUserId(userId: UniqueId): Promise<Result<OrganizationInvitation[], string>> {
    try {
      // Hämta inbjudningar för användaren som är i pending-status
      const { data, error } = await this.supabase
        .from('organization_invitations')
        .select('*')
        .eq('user_id', userId.toString())
        .eq('status', 'pending');

      if (error) return err(error.message);
      
      // Om inga inbjudningar hittades, returnera tom array
      if (!data || data.length === 0) return ok([]);

      // Konvertera till domänobjekt
      const invitations = data.map(invData => {
        const invitationResult = OrganizationInvitation.create({
          id: invData.id,
          organizationId: invData.organization_id,
          userId: invData.user_id,
          invitedBy: invData.invited_by,
          email: invData.email,
          status: invData.status,
          expiresAt: new Date(invData.expires_at),
          createdAt: new Date(invData.created_at),
          respondedAt: invData.responded_at ? new Date(invData.responded_at) : undefined
        });

        if (invitationResult.isErr()) {
          throw new Error(`Kunde inte konvertera inbjudan: ${invitationResult.error}`);
        }

        return invitationResult.value;
      });
      
      return ok(invitations);
    } catch (error) {
      return err(`Fel vid hämtning av användarens inbjudningar: ${error.message}`);
    }
  }
} 