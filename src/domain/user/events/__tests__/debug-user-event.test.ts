/**
 * @jest-environment node
 */

import { UserCreated } from '../UserEvent';
import { UniqueId } from '@/shared/core/UniqueId';

describe('Debug UserEvent', () => {
  it('ska visa strukturen på ett UserCreated-event', () => {
    // Skapa en simpel user med UniqueId
    const userId = new UniqueId('debugUserId');
    const user = { 
      id: userId,
      email: { value: 'debug@example.com' },
      name: 'Debug User' 
    };
    
    // Skapa händelse
    const event = new UserCreated(user as any);
    
    // Logga event-struktur
    console.log('Event properties:', Object.keys(event));
    console.log('Event eventType:', event.eventType);
    console.log('Event aggregateId:', event.aggregateId);
    console.log('Event data:', event.data);
    
    // Verifiera strukturen utan att använda specifika strängjämförelser  
    expect(event.eventType).toBe('UserCreated');
    expect(event.aggregateId).toBeDefined();
    expect(event.data.userId).toBeDefined();
    expect(event.data.timestamp).toBeInstanceOf(Date);
    
    // Inspektera händelse internt
    console.log('Är user direkt tillgänglig?', 'user' in event);
    
    // Försök med mildare jämförelser
    if (typeof event.aggregateId === 'object' && event.aggregateId !== null) {
      console.log('aggregateId är ett objekt, har toString()?', typeof event.aggregateId.toString === 'function');
      if (typeof event.aggregateId.toString === 'function') {
        console.log('aggregateId toString():', event.aggregateId.toString());
      }
    }
  });
}); 