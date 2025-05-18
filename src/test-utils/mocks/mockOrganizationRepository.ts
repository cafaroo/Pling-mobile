/**
 * MockOrganizationRepository
 * 
 * Mockat repository för Organization-entiteten som används i tester
 */

import { Organization } from '@/domain/organization/entities/Organization';
import { Result, ok, err } from '@/shared/core/Result';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * Implementering av ett mockRepository för Organization-entiteter för testning
 */
export class MockOrganizationRepository implements OrganizationRepository {
  private organizations: Map<string, Organization> = new Map();
  private savedOrganizations: Organization[] = [];

  /**
   * Skapar en instans av mockrepository
   */
  constructor() {
    this.organizations = new Map();
    this.savedOrganizations = [];
  }

  /**
   * Återställer mocken till ursprungligt tillstånd
   */
  reset(): void {
    this.organizations.clear();
    this.savedOrganizations = [];
  }

  /**
   * Lägger till en organisation i mocken
   */
  addOrganization(organization: Organization): void {
    this.organizations.set(organization.id.toString(), organization);
  }

  /**
   * Lägger till flera organisationer i mocken
   */
  addOrganizations(organizations: Organization[]): void {
    organizations.forEach(org => this.addOrganization(org));
  }

  /**
   * Hämtar alla sparade organisationer
   */
  getSavedOrganizations(): Organization[] {
    return [...this.savedOrganizations];
  }

  /**
   * Hittar en organisation baserat på ID
   */
  async findById(id: string): Promise<Result<Organization, Error>> {
    const organization = this.organizations.get(id);
    if (!organization) {
      return err(new Error(`Organisation med ID ${id} hittades inte`));
    }
    return ok(organization);
  }

  /**
   * Hittar organisationer som en användare är medlem i
   */
  async findByUserId(userId: string): Promise<Result<Organization[], Error>> {
    const organizations = Array.from(this.organizations.values()).filter(org => {
      return org.props.members.some(member => {
        const memberId = typeof member.userId === 'string' 
          ? member.userId 
          : member.userId?.toString();
        return memberId === userId;
      });
    });
    return ok(organizations);
  }

  /**
   * Söker organisationer baserat på sökterm
   */
  async search(term: string): Promise<Result<Organization[], Error>> {
    if (!term) {
      return ok([]);
    }

    const lowercaseTerm = term.toLowerCase();
    const results = Array.from(this.organizations.values()).filter(org => {
      return org.props.name.toLowerCase().includes(lowercaseTerm);
    });

    return ok(results);
  }

  /**
   * Hittar alla organisationer
   */
  async findAll(): Promise<Result<Organization[], Error>> {
    return ok(Array.from(this.organizations.values()));
  }

  /**
   * Spara en organisation (skapa eller uppdatera)
   */
  async save(organization: Organization): Promise<Result<Organization, Error>> {
    if (!organization || !organization.id) {
      return err(new Error('Kan inte spara organisation: Ogiltigt Organization-objekt eller saknat ID'));
    }
    
    const orgIdStr = organization.id instanceof UniqueId 
      ? organization.id.toString() 
      : String(organization.id);
      
    this.organizations.set(orgIdStr, organization);
    this.savedOrganizations.push(organization);
    return ok(organization);
  }

  /**
   * Radera en organisation
   */
  async delete(organizationId: string | UniqueId): Promise<Result<void, Error>> {
    const orgIdStr = organizationId instanceof UniqueId ? organizationId.toString() : organizationId;
    const organization = this.organizations.get(orgIdStr);
    
    if (!organization) {
      return err(new Error(`Organisation med ID ${orgIdStr} hittades inte`));
    }
    
    this.organizations.delete(orgIdStr);
    return ok(undefined);
  }

  /**
   * Mock-implementation av getAll
   */
  async getAll(): Promise<Result<Organization[], Error>> {
    return ok(Array.from(this.organizations.values()));
  }

  /**
   * Metod som gör mockingen möjlig
   */
  mockAddOrganization(organization: Organization): void {
    if (!organization || !organization.id) {
      throw new Error('Kan inte lägga till organisation: Ogiltigt Organization-objekt eller saknat ID');
    }
    
    const orgIdStr = organization.id instanceof UniqueId 
      ? organization.id.toString() 
      : String(organization.id);
      
    this.organizations.set(orgIdStr, organization);
  }

  /**
   * Mock-implementation som simulerar ett databasfel
   */
  triggerError(methodName: string): void {
    this[methodName as keyof MockOrganizationRepository] = async () => {
      return err(new Error('Simulerat databasfel'));
    };
  }
}

/**
 * Hjälpfunktion för att skapa en mockrepository-instans
 */
export const createMockOrganizationRepository = (): MockOrganizationRepository => {
  return new MockOrganizationRepository();
}; 