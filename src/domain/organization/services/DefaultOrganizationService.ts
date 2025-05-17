import { Result, ok, err } from '@/shared/core/Result';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { OrganizationService } from './OrganizationService';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { OrganizationMember } from '@/domain/organization/value-objects/OrganizationMember';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';

export class DefaultOrganizationService implements OrganizationService {
  private organizationRepository: OrganizationRepository;
  private eventPublisher: IDomainEventPublisher;

  constructor(organizationRepository: OrganizationRepository, eventPublisher: IDomainEventPublisher) {
    this.organizationRepository = organizationRepository;
    this.eventPublisher = eventPublisher;
  }

  async getOrganizationById(id: string): Promise<Result<Organization, Error>> {
    try {
      const result = await this.organizationRepository.findById(id);
      return result;
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid hämtning av organisation'));
    }
  }

  async createOrganization(data: {
    name: string;
    ownerId: string;
    description?: string;
    website?: string;
  }): Promise<Result<Organization, Error>> {
    try {
      const { name, ownerId, description, website } = data;
      
      // Skapa organisationen
      const createResult = Organization.create({
        name,
        description,
        website,
        members: [],
        isActive: true
      });
      
      if (createResult.isErr()) {
        return err(new Error(`Kunde inte skapa organisation: ${createResult.error}`));
      }
      
      const organization = createResult.value;
      
      // Lägg till ägaren som medlem med ägarroll
      const ownerMember = OrganizationMember.create({
        userId: ownerId,
        roles: [OrganizationRole.OWNER]
      });
      
      if (ownerMember.isErr()) {
        return err(new Error(`Kunde inte skapa organisationsmedlem: ${ownerMember.error}`));
      }
      
      const addMemberResult = organization.addMember(ownerMember.value);
      
      if (addMemberResult.isErr()) {
        return err(new Error(`Kunde inte lägga till ägare i organisation: ${addMemberResult.error}`));
      }
      
      // Spara organisationen
      const saveResult = await this.organizationRepository.save(organization);
      
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara organisation: ${saveResult.error}`));
      }
      
      return ok(organization);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid skapande av organisation'));
    }
  }

  async updateOrganization(id: string, data: {
    name?: string;
    description?: string;
    website?: string;
    isActive?: boolean;
  }): Promise<Result<Organization, Error>> {
    try {
      // Hämta organisationen
      const orgResult = await this.organizationRepository.findById(id);
      
      if (orgResult.isErr()) {
        return err(new Error(`Kunde inte hitta organisation: ${orgResult.error}`));
      }
      
      const organization = orgResult.value;
      
      // Uppdatera organisationen
      if (data.name) organization.updateName(data.name);
      if (data.description !== undefined) organization.updateDescription(data.description);
      if (data.website !== undefined) organization.updateWebsite(data.website);
      if (data.isActive !== undefined) data.isActive ? organization.activate() : organization.deactivate();
      
      // Spara organisationen
      const saveResult = await this.organizationRepository.save(organization);
      
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara organisation: ${saveResult.error}`));
      }
      
      return ok(organization);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid uppdatering av organisation'));
    }
  }

  async addMember(organizationId: string, userId: string, roles: string[] = []): Promise<Result<Organization, Error>> {
    try {
      // Hämta organisationen
      const orgResult = await this.organizationRepository.findById(organizationId);
      
      if (orgResult.isErr()) {
        return err(new Error(`Kunde inte hitta organisation: ${orgResult.error}`));
      }
      
      const organization = orgResult.value;
      
      // Skapa medlemmen
      const member = OrganizationMember.create({
        userId,
        roles: roles.length > 0 ? roles : [OrganizationRole.MEMBER]
      });
      
      if (member.isErr()) {
        return err(new Error(`Kunde inte skapa organisationsmedlem: ${member.error}`));
      }
      
      // Lägg till medlemmen i organisationen
      const addResult = organization.addMember(member.value);
      
      if (addResult.isErr()) {
        return err(new Error(`Kunde inte lägga till medlem i organisation: ${addResult.error}`));
      }
      
      // Spara organisationen
      const saveResult = await this.organizationRepository.save(organization);
      
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara organisation: ${saveResult.error}`));
      }
      
      return ok(organization);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid tillägg av organisationsmedlem'));
    }
  }

  async removeMember(organizationId: string, userId: string): Promise<Result<Organization, Error>> {
    try {
      // Hämta organisationen
      const orgResult = await this.organizationRepository.findById(organizationId);
      
      if (orgResult.isErr()) {
        return err(new Error(`Kunde inte hitta organisation: ${orgResult.error}`));
      }
      
      const organization = orgResult.value;
      
      // Ta bort medlemmen från organisationen
      const removeResult = organization.removeMember(userId);
      
      if (removeResult.isErr()) {
        return err(new Error(`Kunde inte ta bort medlem från organisation: ${removeResult.error}`));
      }
      
      // Spara organisationen
      const saveResult = await this.organizationRepository.save(organization);
      
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara organisation: ${saveResult.error}`));
      }
      
      return ok(organization);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid borttagning av organisationsmedlem'));
    }
  }

  async updateMemberRoles(organizationId: string, userId: string, roles: string[]): Promise<Result<Organization, Error>> {
    try {
      // Hämta organisationen
      const orgResult = await this.organizationRepository.findById(organizationId);
      
      if (orgResult.isErr()) {
        return err(new Error(`Kunde inte hitta organisation: ${orgResult.error}`));
      }
      
      const organization = orgResult.value;
      
      // Uppdatera medlemsroller
      const updateResult = organization.updateMemberRoles(userId, roles);
      
      if (updateResult.isErr()) {
        return err(new Error(`Kunde inte uppdatera medlemsroller: ${updateResult.error}`));
      }
      
      // Spara organisationen
      const saveResult = await this.organizationRepository.save(organization);
      
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara organisation: ${saveResult.error}`));
      }
      
      return ok(organization);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid uppdatering av medlemsroller'));
    }
  }
} 