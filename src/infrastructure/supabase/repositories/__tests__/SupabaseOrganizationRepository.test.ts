import { SupabaseClient } from '@supabase/supabase-js';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';
import { SupabaseOrganizationRepository } from '../SupabaseOrganizationRepository';
import { Organization } from '@/domain/organization/entities/Organization';
import { EventBus } from '@/infrastructure/events/EventBus';
import { UniqueId } from '@/shared/core/UniqueId';
import { setup, teardown } from './setup';

// Mockdata för test
const MOCK_OWNER_ID = new UniqueId();
const MOCK_USER_ID = new UniqueId();
const MOCK_ORG_NAME = 'Test Organisation';

describe('SupabaseOrganizationRepository - Inbjudningar', () => {
  let supabase: SupabaseClient;
  let repository: SupabaseOrganizationRepository;
  let eventBus: EventBus;
  let testOrganization: Organization;
  
  beforeAll(async () => {
    // Använd setup från testhjälpare
    const setupResult = await setup();
    supabase = setupResult.supabase;
    eventBus = setupResult.eventBus;
    
    // Skapa repository
    const factory = InfrastructureFactory.getInstance(supabase, eventBus);
    repository = factory.getOrganizationRepository() as SupabaseOrganizationRepository;
  });
  
  afterAll(async () => {
    await teardown();
  });
  
  beforeEach(async () => {
    // Rensa tidigare testdata
    await supabase.from('organization_invitations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('organization_members').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Skapa en testorganisation
    const createResult = Organization.create({
      name: MOCK_ORG_NAME,
      ownerId: MOCK_OWNER_ID.toString()
    });
    
    expect(createResult.isOk()).toBe(true);
    testOrganization = createResult.value;
    
    // Spara organisationen för testerna
    const saveResult = await repository.save(testOrganization);
    expect(saveResult.isOk()).toBe(true);
  });
  
  describe('save (med inbjudningar)', () => {
    it('ska spara en organisation med inbjudningar', async () => {
      // Arrangera - Lägg till en inbjudan
      const inviteResult = testOrganization.inviteUser(
        MOCK_USER_ID,
        'test@exempel.se',
        MOCK_OWNER_ID
      );
      
      expect(inviteResult.isOk()).toBe(true);
      
      // Agera - Spara organisationen med inbjudan
      const saveResult = await repository.save(testOrganization);
      
      // Kontrollera
      expect(saveResult.isOk()).toBe(true);
      
      // Hämta organisationen från databasen igen
      const findResult = await repository.findById(testOrganization.id);
      expect(findResult.isOk()).toBe(true);
      
      // Kontrollera att inbjudan finns med
      const org = findResult.value;
      const pendingInvitations = org.getPendingInvitations();
      
      expect(pendingInvitations.length).toBe(1);
      expect(pendingInvitations[0].userId.equals(MOCK_USER_ID)).toBe(true);
      expect(pendingInvitations[0].email).toBe('test@exempel.se');
      expect(pendingInvitations[0].isPending()).toBe(true);
    });
    
    it('ska uppdatera inbjudningsstatus när en inbjudan accepteras', async () => {
      // Arrangera - Lägg till och spara en inbjudan
      const inviteResult = testOrganization.inviteUser(
        MOCK_USER_ID,
        'test@exempel.se',
        MOCK_OWNER_ID
      );
      
      expect(inviteResult.isOk()).toBe(true);
      
      let saveResult = await repository.save(testOrganization);
      expect(saveResult.isOk()).toBe(true);
      
      // Hämta organisationen med inbjudan
      let findResult = await repository.findById(testOrganization.id);
      expect(findResult.isOk()).toBe(true);
      
      const orgWithInvitation = findResult.value;
      const pendingInvitations = orgWithInvitation.getPendingInvitations();
      expect(pendingInvitations.length).toBe(1);
      
      // Agera - Acceptera inbjudan
      const acceptResult = orgWithInvitation.acceptInvitation(
        pendingInvitations[0].id,
        MOCK_USER_ID
      );
      
      expect(acceptResult.isOk()).toBe(true);
      
      // Spara organisationen med accepterad inbjudan
      saveResult = await repository.save(orgWithInvitation);
      expect(saveResult.isOk()).toBe(true);
      
      // Kontrollera - Hämta organisationen igen
      findResult = await repository.findById(testOrganization.id);
      expect(findResult.isOk()).toBe(true);
      
      const updatedOrg = findResult.value;
      
      // Inbjudan ska nu vara accepterad (inte längre i väntande status)
      const newPendingInvitations = updatedOrg.getPendingInvitations();
      expect(newPendingInvitations.length).toBe(0);
      
      // Användaren ska vara medlem
      const members = updatedOrg.members;
      const newMember = members.find(m => m.userId.equals(MOCK_USER_ID));
      expect(newMember).toBeDefined();
    });
    
    it('ska uppdatera inbjudningsstatus när en inbjudan avböjs', async () => {
      // Arrangera - Lägg till och spara en inbjudan
      const inviteResult = testOrganization.inviteUser(
        MOCK_USER_ID,
        'test@exempel.se',
        MOCK_OWNER_ID
      );
      
      expect(inviteResult.isOk()).toBe(true);
      
      let saveResult = await repository.save(testOrganization);
      expect(saveResult.isOk()).toBe(true);
      
      // Hämta organisationen med inbjudan
      let findResult = await repository.findById(testOrganization.id);
      expect(findResult.isOk()).toBe(true);
      
      const orgWithInvitation = findResult.value;
      const pendingInvitations = orgWithInvitation.getPendingInvitations();
      expect(pendingInvitations.length).toBe(1);
      
      // Agera - Avböj inbjudan
      const declineResult = orgWithInvitation.declineInvitation(
        pendingInvitations[0].id,
        MOCK_USER_ID
      );
      
      expect(declineResult.isOk()).toBe(true);
      
      // Spara organisationen med avböjd inbjudan
      saveResult = await repository.save(orgWithInvitation);
      expect(saveResult.isOk()).toBe(true);
      
      // Kontrollera - Hämta organisationen igen
      findResult = await repository.findById(testOrganization.id);
      expect(findResult.isOk()).toBe(true);
      
      const updatedOrg = findResult.value;
      
      // Inbjudan ska inte längre vara i väntande status
      const newPendingInvitations = updatedOrg.getPendingInvitations();
      expect(newPendingInvitations.length).toBe(0);
      
      // Användaren ska INTE vara medlem
      const members = updatedOrg.members;
      const newMember = members.find(m => m.userId.equals(MOCK_USER_ID));
      expect(newMember).toBeUndefined();
    });
  });
  
  describe('findInvitationsByUserId', () => {
    it('ska hitta inbjudningar för en specifik användare', async () => {
      // Arrangera - Lägg till en inbjudan
      const inviteResult = testOrganization.inviteUser(
        MOCK_USER_ID,
        'test@exempel.se',
        MOCK_OWNER_ID
      );
      
      expect(inviteResult.isOk()).toBe(true);
      
      const saveResult = await repository.save(testOrganization);
      expect(saveResult.isOk()).toBe(true);
      
      // Agera - Hämta inbjudningar för användaren
      const findInvitationsResult = await repository.findInvitationsByUserId(MOCK_USER_ID);
      
      // Kontrollera
      expect(findInvitationsResult.isOk()).toBe(true);
      
      const invitations = findInvitationsResult.value;
      expect(invitations.length).toBe(1);
      
      const invitation = invitations[0];
      expect(invitation.userId.equals(MOCK_USER_ID)).toBe(true);
      expect(invitation.organizationId.equals(testOrganization.id)).toBe(true);
      expect(invitation.isPending()).toBe(true);
    });
    
    it('ska returnera tom lista om inga inbjudningar finns', async () => {
      // Agera - Hämta inbjudningar för en användare utan inbjudningar
      const nonExistentUserId = new UniqueId();
      const findInvitationsResult = await repository.findInvitationsByUserId(nonExistentUserId);
      
      // Kontrollera
      expect(findInvitationsResult.isOk()).toBe(true);
      expect(findInvitationsResult.value).toEqual([]);
    });
  });
}); 