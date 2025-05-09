import { TeamActivity } from '../TeamActivity';
import { UniqueId } from '@/shared/core/UniqueId';
import { ActivityType } from '../../value-objects/ActivityType';

describe('TeamActivity Entity', () => {
  const validProps = {
    id: new UniqueId(),
    teamId: new UniqueId(),
    userId: new UniqueId(),
    type: ActivityType.MEMBER_JOINED,
    timestamp: new Date(),
    metadata: { userName: 'Test User' },
  };

  describe('create', () => {
    it('bör skapa en giltig aktivitet', () => {
      const activityResult = TeamActivity.create(validProps);
      
      expect(activityResult.isOk()).toBe(true);
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        expect(activity.teamId).toEqual(validProps.teamId);
        expect(activity.userId).toEqual(validProps.userId);
        expect(activity.type).toBe(validProps.type);
        expect(activity.metadata).toEqual(validProps.metadata);
        expect(activity.timestamp).toBeInstanceOf(Date);
      }
    });

    it('bör skapa en aktivitet med anpassat datum', () => {
      const customDate = new Date('2023-01-01');
      const activityResult = TeamActivity.create({
        ...validProps,
        timestamp: customDate,
      });
      
      expect(activityResult.isOk()).toBe(true);
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        expect(activity.timestamp.getTime()).toEqual(customDate.getTime());
      }
    });

    it('bör misslyckas med ogiltig aktivitetstyp', () => {
      const result = TeamActivity.create({
        ...validProps,
        type: 'INVALID_TYPE' as ActivityType,
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Ogiltig aktivitetstyp');
      }
    });
  });

  describe('enrichMetadata', () => {
    it('bör lägga till nya metadata utan att ändra befintliga', () => {
      const activityResult = TeamActivity.create(validProps);
      expect(activityResult.isOk()).toBe(true);
      
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        const additionalMetadata = { role: 'admin', action: 'manual' };
        
        const enrichedResult = activity.enrichMetadata(additionalMetadata);
        expect(enrichedResult.isOk()).toBe(true);
        
        if (enrichedResult.isOk()) {
          const enriched = enrichedResult.value;
          // Kontrollera att originalet inte ändrats
          expect(activity.metadata).toEqual(validProps.metadata);
          
          // Kontrollera att nya aktiviteten har kombinerad metadata
          expect(enriched.metadata).toEqual({
            ...validProps.metadata,
            ...additionalMetadata
          });
          
          // Kontrollera att andra egenskaper kvarstår
          expect(enriched.teamId).toEqual(activity.teamId);
          expect(enriched.userId).toEqual(activity.userId);
          expect(enriched.id).toEqual(activity.id);
        }
      }
    });

    it('bör misslyckas när additionalMetadata inte är ett objekt', () => {
      const activityResult = TeamActivity.create(validProps);
      expect(activityResult.isOk()).toBe(true);
      
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        const result = activity.enrichMetadata('invalid' as any);
        
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error).toContain('additionalMetadata måste vara ett objekt');
        }
      }
    });
  });

  describe('isRelatedToUser', () => {
    it('bör returnera true när användaren utfört aktiviteten', () => {
      const testUserId = new UniqueId();
      const activityResult = TeamActivity.create({
        ...validProps,
        userId: testUserId,
      });
      
      expect(activityResult.isOk()).toBe(true);
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        expect(activity.isRelatedToUser(testUserId)).toBe(true);
      }
    });

    it('bör returnera true när användaren finns i metadata', () => {
      const testUserId = new UniqueId();
      const activityResult = TeamActivity.create({
        ...validProps,
        metadata: { userId: testUserId.toString() },
      });
      
      expect(activityResult.isOk()).toBe(true);
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        expect(activity.isRelatedToUser(testUserId)).toBe(true);
      }
    });

    it('bör returnera false när användaren inte är relaterad till aktiviteten', () => {
      const activityResult = TeamActivity.create(validProps);
      const unrelatedUser = new UniqueId();
      
      expect(activityResult.isOk()).toBe(true);
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        expect(activity.isRelatedToUser(unrelatedUser)).toBe(false);
      }
    });
  });

  describe('getDescription', () => {
    function testDescription(type: ActivityType, metadata: any, expectedPart: string) {
      const activityResult = TeamActivity.create({
        ...validProps,
        type: type,
        metadata,
      });
      
      expect(activityResult.isOk()).toBe(true);
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        const description = activity.getDescription();
        expect(description).toContain(expectedPart);
      }
    }

    it('bör generera beskrivning för MEMBER_JOINED med användarnamn', () => {
      testDescription(
        ActivityType.MEMBER_JOINED, 
        { userName: 'Anna Andersson' }, 
        'Anna Andersson gick med i teamet'
      );
    });

    it('bör generera beskrivning för MEMBER_LEFT med användarnamn', () => {
      testDescription(
        ActivityType.MEMBER_LEFT, 
        { userName: 'Erik Eriksson' }, 
        'Erik Eriksson lämnade teamet'
      );
    });

    it('bör generera beskrivning för MEMBER_ROLE_CHANGED med användarnamn och roll', () => {
      testDescription(
        ActivityType.MEMBER_ROLE_CHANGED, 
        { userName: 'Karin Svensson', newRole: 'admin' }, 
        'Karin Svensson fick rollen admin'
      );
    });

    it('bör generera beskrivning för TEAM_UPDATED med uppdaterare', () => {
      testDescription(
        ActivityType.TEAM_UPDATED, 
        { updatedBy: 'Johan Johansson' }, 
        'Teaminformation uppdaterades av Johan Johansson'
      );
    });

    it('bör generera standardbeskrivning för okänd aktivitetstyp', () => {
      // Skapa en egen aktivitetstyp som inte fångas av switch-satsen
      const customEventType = ActivityType.CUSTOM_EVENT;
      testDescription(
        customEventType, 
        {}, 
        `En aktivitet av typen ${customEventType} utfördes`
      );
    });
  });
}); 