import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationInvitation } from '@/domain/organization/value-objects/OrganizationInvitation';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { OrganizationMapper, OrganizationDTO, OrganizationMemberDTO, OrganizationInvitationDTO } from './OrganizationMapper';
import { DomainEventBus } from '@/shared/events/DomainEventBus';
import { CacheService } from '@/infrastructure/cache/CacheService';
import { LoggingService } from '@/infrastructure/logger/LoggingService';
import { PerformanceMonitor } from '@/infrastructure/monitoring/PerformanceMonitor';

export class SupabaseOrganizationRepository implements OrganizationRepository {
  private cacheKeyPrefix = 'organization';

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus: DomainEventBus,
    private readonly cache?: CacheService,
    private readonly logger?: LoggingService,
    private readonly performanceMonitor?: PerformanceMonitor
  ) {}

  async findById(id: UniqueId): Promise<Result<Organization, string>> {
    try {
      // Försök hämta från cache om tillgänglig
      if (this.cache) {
        const cachedOrg = await this.cache.get<Organization>(`${this.cacheKeyPrefix}:${id.toString()}`);
        if (cachedOrg) {
          this.logger?.debug(`Hittade organisation i cache: ${id.toString()}`);
          return ok(cachedOrg);
        }
      }

      const operationId = this.performanceMonitor?.startOperation('database', 'findOrganizationById');

      // Hämta organisation, medlemmar, inbjudningar och team-kopplingar
      const { data, error } = await this.supabase
        .from('organizations')
        .select(`
          *,
          members:organization_members(*)
        `)
        .eq('id', id.toString())
        .single();

      this.performanceMonitor?.endOperation(operationId, !error);

      if (error) {
        return err(`Kunde inte hämta organisation: ${error.message}`);
      }

      if (!data) {
        return err(`Ingen organisation hittades med ID: ${id.toString()}`);
      }

      // Hämta inbjudningar separat
      const { data: invitationsData, error: invitationsError } = await this.supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', id.toString());

      if (invitationsError) {
        return err(`Kunde inte hämta organisationens inbjudningar: ${invitationsError.message}`);
      }

      // Hämta team-kopplingar
      const { data: teamConnectionsData, error: teamConnectionsError } = await this.supabase
        .from('team_organizations')
        .select('team_id')
        .eq('organization_id', id.toString());

      if (teamConnectionsError) {
        return err(`Kunde inte hämta organisationens team-kopplingar: ${teamConnectionsError.message}`);
      }

      // Konvertera data till domän-objekt
      const organizationDTO: OrganizationDTO = {
        id: data.id,
        name: data.name,
        owner_id: data.owner_id,
        settings: data.settings || {},
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      const membersDTO: OrganizationMemberDTO[] = (data.members || []).map((member: any) => ({
        organization_id: member.organization_id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at
      }));

      const invitationsDTO: OrganizationInvitationDTO[] = (invitationsData || []).map((invitation: any) => ({
        id: invitation.id,
        organization_id: invitation.organization_id,
        user_id: invitation.user_id,
        invited_by: invitation.invited_by,
        email: invitation.email,
        status: invitation.status,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at,
        responded_at: invitation.responded_at
      }));

      const teamIds = (teamConnectionsData || []).map((connection: any) => connection.team_id);

      const organization = OrganizationMapper.toDomain(
        organizationDTO,
        membersDTO,
        invitationsDTO,
        teamIds
      );

      // Spara i cache om tillgänglig
      if (this.cache) {
        await this.cache.set(`${this.cacheKeyPrefix}:${id.toString()}`, organization, 60 * 5); // 5 minuter TTL
      }

      return ok(organization);
    } catch (error) {
      this.logger?.error(`Fel vid hämtning av organisation: ${error instanceof Error ? error.message : String(error)}`);
      return err(`Fel vid hämtning av organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByOwnerId(ownerId: UniqueId): Promise<Result<Organization[], string>> {
    try {
      const operationId = this.performanceMonitor?.startOperation('database', 'findOrganizationsByOwnerId');

      const { data, error } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', ownerId.toString());

      this.performanceMonitor?.endOperation(operationId, !error);

      if (error) {
        return err(`Kunde inte hämta organisationer för ägare: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return ok([]);
      }

      // Hämta fullständiga organisationer baserat på ID:n
      const organizations: Organization[] = [];
      for (const item of data) {
        const orgResult = await this.findById(new UniqueId(item.id));
        if (orgResult.isOk()) {
          organizations.push(orgResult.value);
        }
      }

      return ok(organizations);
    } catch (error) {
      this.logger?.error(`Fel vid hämtning av organisationer för ägare: ${error instanceof Error ? error.message : String(error)}`);
      return err(`Fel vid hämtning av organisationer för ägare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByMemberId(userId: UniqueId): Promise<Result<Organization[], string>> {
    try {
      const operationId = this.performanceMonitor?.startOperation('database', 'findOrganizationsByMemberId');

      // Hämta alla organisationer där användaren är medlem
      const { data, error } = await this.supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId.toString());

      this.performanceMonitor?.endOperation(operationId, !error);

      if (error) {
        return err(`Kunde inte hämta organisationer för medlem: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return ok([]);
      }

      // Hämta fullständiga organisationer baserat på ID:n
      const organizations: Organization[] = [];
      for (const item of data) {
        const orgResult = await this.findById(new UniqueId(item.organization_id));
        if (orgResult.isOk()) {
          organizations.push(orgResult.value);
        }
      }

      return ok(organizations);
    } catch (error) {
      this.logger?.error(`Fel vid hämtning av organisationer för medlem: ${error instanceof Error ? error.message : String(error)}`);
      return err(`Fel vid hämtning av organisationer för medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByTeamId(teamId: UniqueId): Promise<Result<Organization, string>> {
    try {
      const operationId = this.performanceMonitor?.startOperation('database', 'findOrganizationByTeamId');

      // Hämta organisation kopplad till teamet
      const { data, error } = await this.supabase
        .from('team_organizations')
        .select('organization_id')
        .eq('team_id', teamId.toString())
        .single();

      this.performanceMonitor?.endOperation(operationId, !error);

      if (error) {
        return err(`Kunde inte hitta organisation för team: ${error.message}`);
      }

      if (!data) {
        return err(`Ingen organisation hittades för team: ${teamId.toString()}`);
      }

      // Hämta fullständig organisation baserat på ID
      return await this.findById(new UniqueId(data.organization_id));
    } catch (error) {
      this.logger?.error(`Fel vid hämtning av organisation för team: ${error instanceof Error ? error.message : String(error)}`);
      return err(`Fel vid hämtning av organisation för team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findInvitationsByUserId(userId: UniqueId): Promise<Result<OrganizationInvitation[], string>> {
    try {
      const operationId = this.performanceMonitor?.startOperation('database', 'findInvitationsByUserId');

      // Hämta alla inbjudningar för användaren
      const { data, error } = await this.supabase
        .from('organization_invitations')
        .select('*')
        .eq('user_id', userId.toString());

      this.performanceMonitor?.endOperation(operationId, !error);

      if (error) {
        return err(`Kunde inte hämta inbjudningar för användare: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return ok([]);
      }

      // Konvertera till domän-objekt
      const invitations: OrganizationInvitation[] = [];
      for (const invitationData of data) {
        const invitationResult = OrganizationInvitation.create({
          id: invitationData.id,
          organizationId: invitationData.organization_id,
          userId: invitationData.user_id,
          invitedBy: invitationData.invited_by,
          email: invitationData.email,
          status: invitationData.status,
          expiresAt: new Date(invitationData.expires_at),
          createdAt: new Date(invitationData.created_at),
          respondedAt: invitationData.responded_at ? new Date(invitationData.responded_at) : undefined
        });

        if (invitationResult.isOk()) {
          invitations.push(invitationResult.value);
        }
      }

      return ok(invitations);
    } catch (error) {
      this.logger?.error(`Fel vid hämtning av inbjudningar för användare: ${error instanceof Error ? error.message : String(error)}`);
      return err(`Fel vid hämtning av inbjudningar för användare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async save(organization: Organization): Promise<Result<void, string>> {
    try {
      const operationId = this.performanceMonitor?.startOperation('database', 'saveOrganization');

      // Konvertera domänmodellen till DTO:er
      const {
        organization: organizationDTO,
        members: membersDTO,
        invitations: invitationsDTO
      } = OrganizationMapper.toDTO(organization);

      // Starta en transaktion genom att använda samma tidsstämpel 
      const now = new Date().toISOString();
      
      // Spara organisationen
      const { error: orgError } = await this.supabase
        .from('organizations')
        .upsert({
          ...organizationDTO,
          updated_at: now
        });

      if (orgError) {
        return err(`Kunde inte spara organisation: ${orgError.message}`);
      }

      // Spara medlemmar - ta först bort alla befintliga medlemmar
      const { error: deleteMembersError } = await this.supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organization.id.toString());

      if (deleteMembersError) {
        return err(`Kunde inte ta bort befintliga medlemmar: ${deleteMembersError.message}`);
      }

      // Lägg till nya medlemmar
      if (membersDTO.length > 0) {
        const { error: membersError } = await this.supabase
          .from('organization_members')
          .upsert(membersDTO);

        if (membersError) {
          return err(`Kunde inte spara medlemmar: ${membersError.message}`);
        }
      }

      // Hantera inbjudningar - uppdatera eller lägg till
      if (invitationsDTO.length > 0) {
        const { error: invitationsError } = await this.supabase
          .from('organization_invitations')
          .upsert(invitationsDTO);

        if (invitationsError) {
          return err(`Kunde inte spara inbjudningar: ${invitationsError.message}`);
        }
      }

      // Hantera team-kopplingar: Här implementeras bara grundläggande stöd, 
      // en komplett implementation skulle behöva hantera upsert av team_organizations

      this.performanceMonitor?.endOperation(operationId, true);

      // Rensa cache för denna organisation
      if (this.cache) {
        await this.cache.remove(`${this.cacheKeyPrefix}:${organization.id.toString()}`);
      }

      // Publicera domänhändelser
      organization.domainEvents.forEach(event => {
        this.eventBus.publish(event);
      });

      // Rensa domänhändelser efter publicering
      organization.clearEvents();

      return ok(undefined);
    } catch (error) {
      this.logger?.error(`Fel vid sparande av organisation: ${error instanceof Error ? error.message : String(error)}`);
      return err(`Fel vid sparande av organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(id: UniqueId): Promise<Result<void, string>> {
    try {
      const operationId = this.performanceMonitor?.startOperation('database', 'deleteOrganization');

      // Ta bort organisation (foreign keys ska ha ON DELETE CASCADE)
      const { error } = await this.supabase
        .from('organizations')
        .delete()
        .eq('id', id.toString());

      this.performanceMonitor?.endOperation(operationId, !error);

      if (error) {
        return err(`Kunde inte ta bort organisation: ${error.message}`);
      }

      // Rensa cache
      if (this.cache) {
        await this.cache.remove(`${this.cacheKeyPrefix}:${id.toString()}`);
      }

      return ok(undefined);
    } catch (error) {
      this.logger?.error(`Fel vid borttagning av organisation: ${error instanceof Error ? error.message : String(error)}`);
      return err(`Fel vid borttagning av organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exists(id: UniqueId): Promise<boolean> {
    try {
      // Kontrollera cache först
      if (this.cache) {
        const cachedOrg = await this.cache.get<Organization>(`${this.cacheKeyPrefix}:${id.toString()}`);
        if (cachedOrg) {
          return true;
        }
      }

      const operationId = this.performanceMonitor?.startOperation('database', 'organizationExists');

      // Kontrollera om organisationen finns
      const { data, error } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('id', id.toString())
        .single();

      this.performanceMonitor?.endOperation(operationId, !error);

      if (error && error.code !== 'PGRST116') { // PGRST116 = Ingen post hittades
        this.logger?.error(`Fel vid kontroll om organisation existerar: ${error.message}`);
        return false;
      }

      return !!data;
    } catch (error) {
      this.logger?.error(`Fel vid kontroll om organisation existerar: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
} 