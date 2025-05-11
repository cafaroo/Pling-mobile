import * as teamService from '@services/teamService';

// Skapa mockSupabaseClient separat från jest.mock
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
      error: null 
    }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  },
  from: jest.fn().mockImplementation((table) => {
    return {
      select: jest.fn().mockImplementation((columns) => {
        return {
          eq: jest.fn().mockImplementation((column, value) => {
            return {
              single: jest.fn().mockResolvedValue({ 
                data: { id: value, name: 'Mock Item' }, 
                error: null 
              }),
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              match: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
              })
            };
          }),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { id: 'mock-id', name: 'Mock Item' }, 
            error: null 
          }),
          match: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis()
        };
      }),
      insert: jest.fn().mockImplementation((data) => {
        return {
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { id: 'new-item-id', ...data }, 
              error: null 
            })
          })
        };
      }),
      update: jest.fn().mockImplementation((data) => {
        return {
          eq: jest.fn().mockImplementation((column, value) => {
            return {
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { id: value, ...data }, 
                  error: null 
                })
              }),
              single: jest.fn().mockResolvedValue({ 
                data: { id: value, ...data }, 
                error: null 
              })
            };
          }),
          match: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis()
        };
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        match: jest.fn().mockResolvedValue({ data: null, error: null }),
        in: jest.fn().mockResolvedValue({ data: null, error: null })
      }),
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'upsert-id' }, error: null })
        })
      })
    };
  }),
  rpc: jest.fn().mockImplementation((funcName, params) => {
    if (funcName === 'create_team_secure') {
      return Promise.resolve({
        data: 'test-team-id',
        error: null
      });
    }
    if (funcName === 'get_team_members_with_profiles') {
      return Promise.resolve({
        data: [
          { 
            id: 'member1', 
            team_id: params?.team_id_param || 'team1', 
            user_id: 'user1', 
            role: 'owner',
            status: 'active',
            joined_at: new Date().toISOString(),
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: null,
            profile_id: 'profile1'
          }
        ],
        error: null
      });
    }
    if (funcName === 'get_user_team_role') {
      return Promise.resolve({
        data: 'admin',
        error: null
      });
    }
    if (funcName === 'update_team_member_role') {
      return Promise.resolve({
        data: {
          id: params?.p_member_id || 'member1',
          role: params?.p_new_role || 'member'
        },
        error: null
      });
    }
    if (funcName === 'join_team_with_code') {
      return Promise.resolve({
        data: {
          success: true,
          message: 'Gick med i teamet',
          team_id: 'team1',
          team_name: 'Testteam'
        },
        error: null
      });
    }
    if (funcName === 'leave_team') {
      return Promise.resolve({
        data: true,
        error: null
      });
    }
    return Promise.resolve({ data: null, error: null });
  }),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.png' } }),
      remove: jest.fn().mockResolvedValue({ error: null })
    })
  }
};

describe('teamService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Använd den nya funktionen för att direkt sätta mockklenten
    teamService.setMockSupabase(mockSupabaseClient);
  });
  
  afterEach(() => {
    // Återställ supabase efter varje test
    teamService.resetSupabase();
  });
  
  describe('getTeam', () => {
    it('returnerar teamdata vid framgångsrik hämtning', async () => {
      // Anpassa mockningarna för detta specifika test
      const mockTeamData = { 
        id: 'team1', 
        name: 'Testteam',
        team_members: []
      };
      
      // Anpassa from för två anrop (först för team, sedan för members)
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: mockTeamData, 
              error: null 
            })
          })
        })
      }));
      
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: [], 
              error: null 
            })
          })
        })
      }));

      const result = await teamService.getTeam('team1');
      
      expect(result).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: 'team1',
          name: 'Testteam'
        })
      });
    });
    
    it('hanterar fel korrekt', async () => {
      // Anpassa mockningem för detta specifika test
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Teamet hittades inte' }
            })
          })
        })
      }));
      
      const result = await teamService.getTeam('nonexistent');
      
      expect(result).toMatchObject({
        data: null,
        success: false,
        status: 'error'
      });
    });
  });
  
  describe('getTeamMembers', () => {
    it('returnerar teammedlemmar vid framgångsrik hämtning', async () => {
      // Mocka rpc-anropet för teammembersfunktionen
      mockSupabaseClient.rpc.mockImplementationOnce((funcName, params) => {
        expect(funcName).toBe('get_team_members_with_profiles');
        expect(params.team_id_param).toBe('team1');
        
        return Promise.resolve({
          data: [
            { 
              id: 'member1', 
              team_id: 'team1', 
              user_id: 'user1', 
              role: 'owner',
              status: 'active',
              joined_at: new Date().toISOString(),
              name: 'Test User',
              email: 'test@example.com',
              avatar_url: null,
              profile_id: 'profile1'
            }
          ],
          error: null
        });
      });
      
      const result = await teamService.getTeamMembers('team1');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('team_id');
      expect(result[0]).toHaveProperty('user_id');
    });
  });
  
  describe('createTeam', () => {
    it('skapar ett nytt team framgångsrikt', async () => {
      const newTeam = { name: 'Nytt team', description: 'Beskrivning' };
      const mockResponse = { ...newTeam, id: 'new-team-id', created_at: new Date().toISOString() };
      
      // Mock för auth.getUser
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });
      
      // Mock för rpc('create_team_secure')
      mockSupabaseClient.rpc.mockImplementationOnce((funcName, params) => {
        expect(funcName).toBe('create_team_secure');
        return Promise.resolve({
          data: 'new-team-id',
          error: null
        });
      });
      
      // Mock för from().select().eq().single() efter teamet skapats
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockResponse,
              error: null
            })
          })
        })
      }));
      
      const result = await teamService.createTeam(newTeam);
      
      expect(result).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: 'new-team-id',
          name: 'Nytt team'
        })
      });
    });
    
    it('hanterar fel vid teamskapande', async () => {
      const newTeam = { name: 'Felaktigt team' };
      
      // Simulera ett autentiseringsfel
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Ingen användare inloggad')
      });
      
      const result = await teamService.createTeam(newTeam);
      
      expect(result).toMatchObject({
        data: null,
        success: false,
        status: 'error'
      });
    });
  });
  
  describe('updateTeam', () => {
    it('uppdaterar ett team framgångsrikt', async () => {
      const updatedTeam = { id: 'team1', name: 'Uppdaterat team' };
      
      // Mock för from().update().eq().select().single()
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedTeam,
                error: null
              })
            })
          })
        })
      }));
      
      const result = await teamService.updateTeam('team1', { name: 'Uppdaterat team' });
      
      expect(result).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: 'team1',
          name: 'Uppdaterat team'
        })
      });
    });
  });
  
  describe('deleteTeam', () => {
    it('tar bort ett team framgångsrikt', async () => {
      // Mock för from().delete().eq()
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      }));
      
      await expect(teamService.deleteTeam('team1')).resolves.not.toThrow();
    });
  });
  
  describe('getCurrentUserRole', () => {
    it('returnerar användarroll i teamet', async () => {
      // Mock för from().select().match().single()
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          match: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      }));
      
      const result = await teamService.getCurrentUserRole('team1', 'user1');
      
      expect(result).toMatchObject({
        success: true,
        data: 'admin'
      });
    });
    
    it('hanterar situation när användaren inte är medlem', async () => {
      // Mock för from().select().match().single() med fel
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          match: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Ingen post hittad' }
            })
          })
        })
      }));
      
      const result = await teamService.getCurrentUserRole('team1', 'user2');
      
      expect(result).toMatchObject({
        data: null,
        status: 'error',
        success: false
      });
    });
  });
}); 