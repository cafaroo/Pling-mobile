import { TeamDescription } from '../TeamDescription';

describe('TeamDescription', () => {
  it('ska skapa ett giltigt TeamDescription', () => {
    const descResult = TeamDescription.create('En beskrivning av teamet');
    expect(descResult.isOk()).toBe(true);
    
    if (descResult.isOk()) {
      const desc = descResult.value;
      expect(desc.value).toBe('En beskrivning av teamet');
    }
  });
  
  it('ska hantera en tom beskrivning', () => {
    const descResult = TeamDescription.create();
    expect(descResult.isOk()).toBe(true);
    
    if (descResult.isOk()) {
      const desc = descResult.value;
      expect(desc.value).toBe('');
    }
  });
  
  it('ska trimma bort överflödiga mellanslag', () => {
    const descResult = TeamDescription.create('   En beskrivning   ');
    expect(descResult.isOk()).toBe(true);

    if (descResult.isOk()) {
      expect(descResult.value.value).toBe('En beskrivning');
    }
  });
  
  it('ska misslyckas för en för lång beskrivning', () => {
    // Skapa en lång beskrivning (501 tecken)
    const longDescription = 'a'.repeat(501);
    
    const descResult = TeamDescription.create(longDescription);
    
    expect(descResult.isOk()).toBe(false);
    expect(descResult.isErr()).toBe(true);

    if (descResult.isErr()) {
      expect(descResult.error).toContain('får inte vara längre än 500 tecken');
    }
  });
  
  it('ska jämföra två identiska beskrivningar som lika', () => {
    const desc1Result = TeamDescription.create('En beskrivning');
    const desc2Result = TeamDescription.create('En beskrivning');
    
    expect(desc1Result.isOk() && desc2Result.isOk()).toBe(true);
    
    if (desc1Result.isOk() && desc2Result.isOk()) {
      const desc1 = desc1Result.value;
      const desc2 = desc2Result.value;
      
      expect(desc1.equals(desc2)).toBe(true);
    }
  });
  
  it('ska jämföra två olika beskrivningar som olika', () => {
    const desc1Result = TeamDescription.create('En beskrivning A');
    const desc2Result = TeamDescription.create('En beskrivning B');
    
    expect(desc1Result.isOk() && desc2Result.isOk()).toBe(true);
    
    if (desc1Result.isOk() && desc2Result.isOk()) {
      const desc1 = desc1Result.value;
      const desc2 = desc2Result.value;
      
      expect(desc1.equals(desc2)).toBe(false);
    }
  });
  
  it('ska kunna avgöra om beskrivningen är tom', () => {
    const emptyResult = TeamDescription.create('');
    const nonEmptyResult = TeamDescription.create('Något innehåll');
    
    expect(emptyResult.isOk() && nonEmptyResult.isOk()).toBe(true);
    
    if (emptyResult.isOk() && nonEmptyResult.isOk()) {
      const empty = emptyResult.value;
      const nonEmpty = nonEmptyResult.value;
      
      expect(empty.isEmpty()).toBe(true);
      expect(nonEmpty.isEmpty()).toBe(false);
    }
  });
}); 