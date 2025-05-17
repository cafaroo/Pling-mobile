/**
 * MockOrganizationRepository
 * 
 * Mockat repository för Organization-entiteten som används i tester
 */

import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { Result, ok, err } from '@/shared/core/Result';

export class MockOrganizationRepository implements OrganizationRepository {
  private organizations: Map<string, Organization> = new Map();
  private savedOrganizations: Organization[] = [];

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
   * Mock-implementation av findById
   */
  async findById(id: string): Promise<Result<Organization, Error>> {
    const organization = this.organizations.get(id);
    
    if (!organization) {
      return err(new Error(`Organisation med ID ${id} hittades inte`));
    }
    
    return ok(organization);
  }

  /**
   * Mock-implementation av findByName
   */
  async findByName(name: string): Promise<Result<Organization[], Error>> {
    const matchingOrganizations = Array.from(this.organizations.values())
      .filter(org => org.name.toLowerCase().includes(name.toLowerCase()));
    
    return ok(matchingOrganizations);
  }

  /**
   * Mock-implementation av findByMemberId
   */
  async findByMemberId(userId: string): Promise<Result<Organization[], Error>> {
    const matchingOrganizations = Array.from(this.organizations.values())
      .filter(org => org.hasMember(userId));
    
    return ok(matchingOrganizations);
  }

  /**
   * Mock-implementation av save
   */
  async save(organization: Organization): Promise<Result<Organization, Error>> {
    this.organizations.set(organization.id.toString(), organization);
    this.savedOrganizations.push(organization);
    return ok(organization);
  }

  /**
   * Mock-implementation av delete
   */
  async delete(id: string): Promise<Result<void, Error>> {
    if (!this.organizations.has(id)) {
      return err(new Error(`Organisation med ID ${id} hittades inte`));
    }

    this.organizations.delete(id);
    return ok(undefined);
  }

  /**
   * Mock-implementation av getAll
   */
  async getAll(): Promise<Result<Organization[], Error>> {
    return ok(Array.from(this.organizations.values()));
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

// Exportera en factory-funktion för enkel användning
export const createMockOrganizationRepository = (): MockOrganizationRepository => {
  return new MockOrganizationRepository();
}; 