import { TeamActivity } from '../TeamActivity';
import { UniqueId } from '@/shared/core/UniqueId';
import { ActivityType } from '../../value-objects/ActivityType';

describe('TeamActivity Entity', () => {
  const validProps = {
    teamId: new UniqueId(),
    performedBy: new UniqueId(),
    activityType: ActivityType.MEMBER_JOINED,
    metadata: { userName: 'Test User' },
  };

  describe('create', () => {
    it('bör skapa en giltig aktivitet', () => {
      const activityResult = TeamActivity.create(validProps);
      
      expect(activityResult.isOk()).toBe(true);
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        expect(activity.teamId).toBe(validProps.teamId);
        expect(activity.performedBy).toBe(validProps.performedBy);
        expect(activity.activityType).toBe(validProps.activityType);
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
        expect(activity.timestamp).toEqual(customDate);
      }
    });

    it('bör misslyckas utan teamId', () => {
      const invalidProps = { ...validProps };
      delete (invalidProps as any).teamId;
      
      const result = TeamActivity.create(invalidProps as any);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Team-ID är obligatoriskt');
      }
    });

    it('bör misslyckas utan performedBy', () => {
      const invalidProps = { ...validProps };
      delete (invalidProps as any).performedBy;
      
      const result = TeamActivity.create(invalidProps as any);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('performedBy är obligatoriskt');
      }
    });

    it('bör misslyckas utan activityType', () => {
      const invalidProps = { ...validProps };
      delete (invalidProps as any).activityType;
      
      const result = TeamActivity.create(invalidProps as any);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('activityType är obligatoriskt');
      }
    });

    it('bör misslyckas när metadata inte är ett objekt', () => {
      const result = TeamActivity.create({
        ...validProps,
        metadata: 'invalid' as any,
      });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('metadata måste vara ett objekt');
      }
    });

    it('bör använda en tom metadata-objekt när ingen metadata angetts', () => {
      const propsWithoutMetadata = { ...validProps };
      delete (propsWithoutMetadata as any).metadata;
      
      const result = TeamActivity.create(propsWithoutMetadata);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.metadata).toEqual({});
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
          expect(enriched.teamId).toBe(activity.teamId);
          expect(enriched.performedBy).toBe(activity.performedBy);
          expect(enriched.id).toBe(activity.id);
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
      const userId = new UniqueId();
      const activityResult = TeamActivity.create({
        ...validProps,
        performedBy: userId,
      });
      
      expect(activityResult.isOk()).toBe(true);
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        expect(activity.isRelatedToUser(userId)).toBe(true);
      }
    });

    it('bör returnera true när användaren är målet för aktiviteten', () => {
      const userId = new UniqueId();
      const activityResult = TeamActivity.create({
        ...validProps,
        targetId: userId,
      });
      
      expect(activityResult.isOk()).toBe(true);
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        expect(activity.isRelatedToUser(userId)).toBe(true);
      }
    });

    it('bör returnera true när användaren finns i metadata', () => {
      const userId = new UniqueId();
      const activityResult = TeamActivity.create({
        ...validProps,
        metadata: { userId: userId.toString() },
      });
      
      expect(activityResult.isOk()).toBe(true);
      if (activityResult.isOk()) {
        const activity = activityResult.value;
        expect(activity.isRelatedToUser(userId)).toBe(true);
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
        activityType: type,
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

    it('bör generera beskrivning för ROLE_CHANGED med användarnamn och roll', () => {
      testDescription(
        ActivityType.ROLE_CHANGED, 
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
      const unknownType = 'unknown_type' as ActivityType;
      testDescription(
        unknownType, 
        {}, 
        `En aktivitet av typen ${unknownType} utfördes`
      );
    });
  });
}); 