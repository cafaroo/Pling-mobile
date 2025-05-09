const { UserProfile } = require('../domain/user/entities/UserProfile');
const { UserSettings } = require('../domain/user/entities/UserSettings');
const { User } = require('../domain/user/entities/User');
const { UniqueId } = require('../shared/core/UniqueId');

// Försök skapa ett User-objekt
async function test() {
  try {
    const profile = UserProfile.create({
      firstName: 'Test',
      lastName: 'User',
      displayName: 'TestUser',
      bio: 'Test bio',
      location: 'Stockholm'
    });
    
    const settings = UserSettings.create({
      theme: 'light',
      language: 'sv',
      notifications: {
        email: true,
        push: true,
        inApp: true
      },
      privacy: {
        showProfile: true,
        showActivity: true,
        showTeams: true
      }
    });
    
    const userResult = await User.create({
      id: new UniqueId('test-id'),
      email: 'test@example.com',
      name: 'Test User',
      profile: profile.value,
      settings: settings.value,
      teamIds: [],
      roleIds: [],
      status: 'active'
    });
    
    console.log('User creation success:', userResult.isOk());
    if (userResult.isOk()) {
      console.log('User ID:', userResult.value.id);
    }
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

test(); 