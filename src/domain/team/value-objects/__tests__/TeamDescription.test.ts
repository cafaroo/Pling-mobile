import { TeamDescription } from '../TeamDescription';

describe('TeamDescription', () => {
  it('ska skapa ett giltigt TeamDescription', () => {
    const descResult = TeamDescription.create('En beskrivning av teamet');
    expect(descResult.isSuccess).toBe(true);
    
    if (descResult.isSuccess) {
      const desc = descResult.getValue();
      expect(desc.value).toBe('En beskrivning av teamet');
      expect(desc.toString()).toBe('En beskrivning av teamet');
    }
  });
  
  it('ska hantera en tom beskrivning', () => {
    const descResult = TeamDescription.create();
    expect(descResult.isSuccess).toBe(true);
    
    if (descResult.isSuccess) {
      const desc = descResult.getValue();
      expect(desc.value).toBe('');
      expect(desc.isEmpty()).toBe(true);
    }
  });
  
  it('ska trimma bort överflödiga mellanslag', () => {
    const descResult = TeamDescription.create('   En beskrivning   ');
    expect(descResult.isSuccess).toBe(true);
    
    if (descResult.isSuccess) {
      expect(descResult.getValue().value).toBe('En beskrivning');
    }
  });
  
  it('ska misslyckas för en för lång beskrivning', () => {
    // Skapa en väldigt lång beskrivning
    const longDescription = 'A'.repeat(501);
    const descResult = TeamDescription.create(longDescription);
    
    expect(descResult.isSuccess).toBe(false);
    expect(descResult.isFailure).toBe(true);
    
    if (descResult.isFailure) {
      expect(descResult.error).toContain('inte vara längre än');
    }
  });
  
  it('ska jämföra två identiska beskrivningar som lika', () => {
    const desc1Result = TeamDescription.create('En beskrivning');
    const desc2Result = TeamDescription.create('En beskrivning');
    
    expect(desc1Result.isSuccess && desc2Result.isSuccess).toBe(true);
    
    if (desc1Result.isSuccess && desc2Result.isSuccess) {
      const desc1 = desc1Result.getValue();
      const desc2 = desc2Result.getValue();
      
      expect(desc1.equals(desc2)).toBe(true);
    }
  });
  
  it('ska jämföra två olika beskrivningar som olika', () => {
    const desc1Result = TeamDescription.create('En beskrivning A');
    const desc2Result = TeamDescription.create('En beskrivning B');
    
    expect(desc1Result.isSuccess && desc2Result.isSuccess).toBe(true);
    
    if (desc1Result.isSuccess && desc2Result.isSuccess) {
      const desc1 = desc1Result.getValue();
      const desc2 = desc2Result.getValue();
      
      expect(desc1.equals(desc2)).toBe(false);
    }
  });
  
  it('ska kunna avgöra om beskrivningen är tom', () => {
    const emptyResult = TeamDescription.create('');
    const nonEmptyResult = TeamDescription.create('Något innehåll');
    
    expect(emptyResult.isSuccess && nonEmptyResult.isSuccess).toBe(true);
    
    if (emptyResult.isSuccess && nonEmptyResult.isSuccess) {
      const empty = emptyResult.getValue();
      const nonEmpty = nonEmptyResult.getValue();
      
      expect(empty.isEmpty()).toBe(true);
      expect(nonEmpty.isEmpty()).toBe(false);
    }
  });
}); 