import { TeamSettings, TeamSettingsProps } from '../../entities/TeamSettings';

describe('TeamSettings', () => {
  it('ska skapa TeamSettings med standardvärden', () => {
    const settingsResult = TeamSettings.create();
    expect(settingsResult.isOk()).toBe(true);
    
    if (settingsResult.isOk()) {
      const settings = settingsResult.value;
      expect(settings.props.isPrivate).toBe(false);
      expect(settings.props.requiresApproval).toBe(false);
      expect(settings.props.maxMembers).toBe(50);
      expect(settings.props.allowGuests).toBe(false);
      
      // Verifiera att notifikationsinställningar har standardvärden
      expect(settings.props.notificationSettings.newMembers).toBe(true);
      expect(settings.props.notificationSettings.memberLeft).toBe(true);
      expect(settings.props.notificationSettings.roleChanges).toBe(true);
      expect(settings.props.notificationSettings.activityUpdates).toBe(true);
      
      // Verifiera att communications har standardvärden
      expect(settings.props.communications?.enableChat).toBe(true);
      expect(settings.props.communications?.enableForums).toBe(false);
      expect(settings.props.communications?.moderationLevel).toBe('basic');
      
      // Verifiera att permissions har standardvärden
      expect(settings.props.permissions?.restrictFileSharing).toBe(false);
      expect(settings.props.permissions?.allowExternalLinks).toBe(true);
      expect(settings.props.permissions?.requireApprovalForPosts).toBe(false);
    }
  });
  
  it('ska skapa TeamSettings med anpassade värden', () => {
    const customSettings: Partial<TeamSettingsProps> = {
      isPrivate: true,
      requiresApproval: true,
      maxMembers: 100,
      allowGuests: true,
      notificationSettings: {
        newMembers: false,
        memberLeft: true,
        roleChanges: false,
        activityUpdates: true
      },
      communications: {
        enableChat: false,
        enableForums: true,
        moderationLevel: 'strict'
      },
      permissions: {
        restrictFileSharing: true,
        allowExternalLinks: false,
        requireApprovalForPosts: true
      }
    };
    
    const settingsResult = TeamSettings.create(customSettings);
    expect(settingsResult.isOk()).toBe(true);
    
    if (settingsResult.isOk()) {
      const settings = settingsResult.value;
      expect(settings.props.isPrivate).toBe(true);
      expect(settings.props.requiresApproval).toBe(true);
      expect(settings.props.maxMembers).toBe(100);
      expect(settings.props.allowGuests).toBe(true);
      
      // Verifiera anpassade notifikationsinställningar
      expect(settings.props.notificationSettings.newMembers).toBe(false);
      expect(settings.props.notificationSettings.memberLeft).toBe(true);
      expect(settings.props.notificationSettings.roleChanges).toBe(false);
      expect(settings.props.notificationSettings.activityUpdates).toBe(true);
      
      // Verifiera anpassade communications
      expect(settings.props.communications?.enableChat).toBe(false);
      expect(settings.props.communications?.enableForums).toBe(true);
      expect(settings.props.communications?.moderationLevel).toBe('strict');
      
      // Verifiera anpassade permissions
      expect(settings.props.permissions?.restrictFileSharing).toBe(true);
      expect(settings.props.permissions?.allowExternalLinks).toBe(false);
      expect(settings.props.permissions?.requireApprovalForPosts).toBe(true);
    }
  });
  
  it('ska misslyckas med för lågt maxMembers', () => {
    const settingsResult = TeamSettings.create({
      maxMembers: 1
    });
    
    expect(settingsResult.isOk()).toBe(false);
    expect(settingsResult.isErr()).toBe(true);
    
    if (settingsResult.isErr()) {
      expect(settingsResult.error).toContain('Minsta antal medlemmar måste vara 2');
    }
  });
  
  it('ska misslyckas med för högt maxMembers', () => {
    const settingsResult = TeamSettings.create({
      maxMembers: 2000
    });
    
    expect(settingsResult.isOk()).toBe(false);
    expect(settingsResult.isErr()).toBe(true);
    
    if (settingsResult.isErr()) {
      expect(settingsResult.error).toContain('Största antal medlemmar kan inte överstiga');
    }
  });
  
  it('ska misslyckas med ogiltig moderationLevel', () => {
    const settingsResult = TeamSettings.create({
      communications: {
        enableChat: true,
        enableForums: true,
        // @ts-ignore - Testar felaktig moderationLevel-typ
        moderationLevel: 'invalid'
      }
    });
    
    expect(settingsResult.isOk()).toBe(false);
    expect(settingsResult.isErr()).toBe(true);
    
    if (settingsResult.isErr()) {
      expect(settingsResult.error).toContain('Ogiltig moderationsnivå');
    }
  });
  
  it('ska korrekt uppdatera alla inställningar', () => {
    const settingsResult = TeamSettings.create();
    expect(settingsResult.isOk()).toBe(true);
    
    if (settingsResult.isOk()) {
      const settings = settingsResult.value;
      
      const updatedResult = settings.update({
        isPrivate: true,
        maxMembers: 75
      });
      
      expect(updatedResult.isOk()).toBe(true);
      
      if (updatedResult.isOk()) {
        const updatedSettings = updatedResult.value;
        expect(updatedSettings.props.isPrivate).toBe(true);
        expect(updatedSettings.props.maxMembers).toBe(75);
        
        // Verifiera att andra inställningar inte ändrats
        expect(updatedSettings.props.requiresApproval).toBe(false);
        expect(updatedSettings.props.allowGuests).toBe(false);
      }
    }
  });
  
  it('ska korrekt uppdatera bara notifikationsinställningar', () => {
    const settingsResult = TeamSettings.create();
    expect(settingsResult.isOk()).toBe(true);
    
    if (settingsResult.isOk()) {
      const settings = settingsResult.value;
      
      const updatedResult = settings.updateNotifications({
        newMembers: false,
        activityUpdates: false
      });
      
      expect(updatedResult.isOk()).toBe(true);
      
      if (updatedResult.isOk()) {
        const updatedSettings = updatedResult.value;
        expect(updatedSettings.props.notificationSettings.newMembers).toBe(false);
        expect(updatedSettings.props.notificationSettings.activityUpdates).toBe(false);
        
        // Verifiera att andra notifikationsinställningar inte ändrats
        expect(updatedSettings.props.notificationSettings.memberLeft).toBe(true);
        expect(updatedSettings.props.notificationSettings.roleChanges).toBe(true);
        
        // Verifiera att huvudinställningar inte ändrats
        expect(updatedSettings.props.isPrivate).toBe(false);
        expect(updatedSettings.props.requiresApproval).toBe(false);
      }
    }
  });
  
  it('ska korrekt uppdatera bara kommunikationsinställningar', () => {
    const settingsResult = TeamSettings.create();
    expect(settingsResult.isOk()).toBe(true);
    
    if (settingsResult.isOk()) {
      const settings = settingsResult.value;
      
      const updatedResult = settings.updateCommunications({
        enableChat: false,
        enableForums: true
      });
      
      expect(updatedResult.isOk()).toBe(true);
      
      if (updatedResult.isOk()) {
        const updatedSettings = updatedResult.value;
        expect(updatedSettings.props.communications?.enableChat).toBe(false);
        expect(updatedSettings.props.communications?.enableForums).toBe(true);
        
        // Verifiera att andra kommunikationsinställningar inte ändrats
        expect(updatedSettings.props.communications?.moderationLevel).toBe('basic');
      }
    }
  });
  
  it('ska korrekt uppdatera bara behörighetsinställningar', () => {
    const settingsResult = TeamSettings.create();
    expect(settingsResult.isOk()).toBe(true);
    
    if (settingsResult.isOk()) {
      const settings = settingsResult.value;
      
      const updatedResult = settings.updatePermissions({
        restrictFileSharing: true,
        requireApprovalForPosts: true
      });
      
      expect(updatedResult.isOk()).toBe(true);
      
      if (updatedResult.isOk()) {
        const updatedSettings = updatedResult.value;
        expect(updatedSettings.props.permissions?.restrictFileSharing).toBe(true);
        expect(updatedSettings.props.permissions?.requireApprovalForPosts).toBe(true);
        
        // Verifiera att andra behörighetsinställningar inte ändrats
        expect(updatedSettings.props.permissions?.allowExternalLinks).toBe(true);
      }
    }
  });
  
  it('ska returnera korrekt DTO-objekt', () => {
    const settingsResult = TeamSettings.create({
      isPrivate: true,
      maxMembers: 30
    });
    
    expect(settingsResult.isOk()).toBe(true);
    
    if (settingsResult.isOk()) {
      const settings = settingsResult.value;
      const dto = settings.toDTO();
      
      expect(dto.isPrivate).toBe(true);
      expect(dto.maxMembers).toBe(30);
      expect(dto.requiresApproval).toBe(false);
      expect(dto.allowGuests).toBe(false);
      
      // Verifiera att DTO är en djup kopia
      expect(dto).not.toBe(settings.props);
      expect(dto.notificationSettings).not.toBe(settings.props.notificationSettings);
      expect(dto.communications).not.toBe(settings.props.communications);
      expect(dto.permissions).not.toBe(settings.props.permissions);
    }
  });
}); 