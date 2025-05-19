/**
 * MockOrganizationRepository
 * 
 * Mockat repository för Organization-entiteten som används i tester
 */

import { Organization } from '@/domain/organization/entities/Organization';
import { Result, ok, err } from '@/shared/core/Result';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

/**
 * Implementering av ett mockRepository för Organization-entiteter för testning
 */
export class MockOrganizationRepository implements OrganizationRepository {
  // Gör organizations map publik för testning
  public organizations: Map<string, Organization> = new Map();
  private savedOrganizations: Organization[] = [];
  private teamRepository?: TeamRepository;

  /**
   * Skapar en instans av mockrepository
   */
  constructor(teamRepository?: TeamRepository) {
    this.organizations = new Map();
    this.savedOrganizations = [];
    this.teamRepository = teamRepository;
  }

  /**
   * Sätter teamRepository för att hantera borttagning av medlemmar från team
   */
  setTeamRepository(teamRepository: TeamRepository): void {
    this.teamRepository = teamRepository;
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
    if (!organization || !organization.id) {
      console.error('Försökte lägga till organisation utan giltigt ID', organization);
      return;
    }
    // Använd toString för att säkerställa att vi alltid använder string-nycklar
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
  async findById(id: string | UniqueId): Promise<Result<Organization, Error>> {
    const idStr = typeof id === 'string' ? id : id.toString();
    console.log('findById söker efter:', idStr);
    console.log('organizations map innehåller:', Array.from(this.organizations.keys()));
    
    const organization = this.organizations.get(idStr);
    if (!organization) {
      return err(new Error(`Organisation med ID ${idStr} hittades inte`));
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
    
    // Använd toString för att säkerställa att vi alltid använder string-nycklar
    const orgIdStr = organization.id.toString();
      
    this.organizations.set(orgIdStr, organization);
    this.savedOrganizations.push(organization);
    return ok(organization);
  }

  /**
   * Tar bort en medlem från organisationen och alla dess team
   * @param organizationId Organisationens ID
   * @param userId Användarens ID som ska tas bort
   */
  async removeMember(organizationId: string | UniqueId, userId: string | UniqueId): Promise<Result<void, Error>> {
    const orgIdStr = typeof organizationId === 'string' ? organizationId : organizationId.toString();
    const userIdStr = typeof userId === 'string' ? userId : userId.toString();
    
    // 1. Hitta organisationen
    const organization = this.organizations.get(orgIdStr);
    if (!organization) {
      return err(new Error(`Organisation med ID ${orgIdStr} hittades inte`));
    }
    
    // 2. Ta bort medlemmen från organisationen
    const removeMemberResult = organization.removeMember(new UniqueId(userIdStr));
    if (removeMemberResult.isErr()) {
      return err(new Error(`Kunde inte ta bort medlem från organisation: ${removeMemberResult.error}`));
    }
    
    // 3. Spara organisationen
    this.organizations.set(orgIdStr, organization);
    
    // 4. Om teamRepository är tillgängligt, ta bort medlemmen från alla team i organisationen
    if (this.teamRepository) {
      try {
        // Hämta alla team för organisationen
        const teamsResult = await this.teamRepository.findByOrganizationId(orgIdStr);
        if (teamsResult.isOk()) {
          const teams = teamsResult.value;
          
          // För varje team, ta bort medlemmen om den inte är ägare
          for (const team of teams) {
            // Kontrollera om användaren är ägare av teamet
            const teamOwnerId = team.ownerId?.toString ? team.ownerId.toString() : team.ownerId;
            if (teamOwnerId === userIdStr) {
              console.log(`Användare ${userIdStr} är ägare av team ${team.id.toString()}, behåller medlemskap`);
              continue;
            }
            
            // Ta bort användaren som medlem
            const teamMemberRemoveResult = team.removeMember(new UniqueId(userIdStr));
            if (teamMemberRemoveResult.isOk()) {
              await this.teamRepository.save(team);
            }
          }
        }
      } catch (error) {
        console.error('Fel vid borttagning av teammedlemmar:', error);
        // Vi fortsätter även om det blir fel med teamborttagning
      }
    }
    
    return ok(undefined);
  }

  /**
   * Radera en organisation
   */
  async delete(organizationId: string | UniqueId): Promise<Result<void, Error>> {
    const orgIdStr = typeof organizationId === 'string' ? organizationId : organizationId.toString();
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
    
    // Använd toString för att säkerställa att vi alltid använder string-nycklar
    const orgIdStr = organization.id.toString();
      
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

  /**
   * Lägger till ett team till en organisation
   */
  async addTeam(organizationId: UniqueId, teamId: UniqueId): Promise<Result<void, Error>> {
    console.log(`Anropar mockOrganizationRepository.addTeam med orgId=${organizationId.toString()}, teamId=${teamId.toString()}`);
    
    // Verifiera att vi har en giltig organisation
    const orgIdStr = organizationId.toString();
    const org = this.organizations.get(orgIdStr);
    
    if (!org) {
      console.error(`Organisation med ID ${orgIdStr} hittades inte i mockRepository`);
      console.log('Tillgängliga organisationer:', Array.from(this.organizations.keys()));
      return err(new Error(`Organisation med ID ${orgIdStr} hittades inte`));
    }
    
    // Om teamRepository finns, verifiera att teamet existerar
    if (this.teamRepository) {
      try {
        const teamIdStr = teamId.toString();
        const teamResult = await this.teamRepository.findById(teamIdStr);
        
        if (teamResult.isErr()) {
          console.error(`Team med ID ${teamIdStr} hittades inte i teamRepository`);
          return err(new Error(`Team med ID ${teamIdStr} hittades inte: ${teamResult.error}`));
        }
      } catch (error) {
        console.error('Fel vid kontroll av team:', error);
        return err(new Error(`Fel vid kontroll av team: ${error instanceof Error ? error.message : String(error)}`));
      }
    }
    
    // Lägg faktiskt till teamet i organisationen
    org.teamIds.push(teamId);
    // Spara organisationen
    await this.save(org);
    console.log(`Team ${teamId.toString()} tillagt till organisation ${orgIdStr} i mockRepository`);
    return ok(undefined);
  }
  
  /**
   * Tar bort ett team från en organisation
   */
  async removeTeam(organizationId: UniqueId, teamId: UniqueId): Promise<Result<void, Error>> {
    // I en riktig implementation skulle vi uppdatera databasen
    // I mocken behöver vi bara se till att det finns en organisation med detta ID
    const orgIdStr = organizationId.toString();
    const org = this.organizations.get(orgIdStr);
    
    if (!org) {
      return err(new Error(`Organisation med ID ${orgIdStr} hittades inte`));
    }
    
    return ok(undefined);
  }
}

/**
 * Hjälpfunktion för att skapa en mockrepository-instans
 */
export const createMockOrganizationRepository = (teamRepository?: TeamRepository): MockOrganizationRepository => {
  return new MockOrganizationRepository(teamRepository);
}; 