import { TeamName } from '../TeamName';

describe('TeamName', () => {
  it('ska skapa ett giltigt TeamName', () => {
    const nameResult = TeamName.create('Testteam');
    expect(nameResult.isOk()).toBe(true);
    
    if (nameResult.isOk()) {
      const name = nameResult.value;
      expect(name.value).toBe('Testteam');
      expect(name.toString()).toBe('Testteam');
    }
  });
  
  it('ska trimma bort överflödiga mellanslag', () => {
    const nameResult = TeamName.create('   Testteam   ');
    expect(nameResult.isOk()).toBe(true);
    
    if (nameResult.isOk()) {
      expect(nameResult.value.value).toBe('Testteam');
    }
  });
  
  it('ska misslyckas för ett kort namn', () => {
    const nameResult = TeamName.create('A');
    expect(nameResult.isOk()).toBe(false);
    expect(nameResult.isErr()).toBe(true);
    
    if (nameResult.isErr()) {
      expect(nameResult.error).toContain('minst 2 tecken');
    }
  });
  
  it('ska misslyckas för ett för långt namn', () => {
    // Skapa ett väldigt långt namn
    const longName = 'A'.repeat(101);
    const nameResult = TeamName.create(longName);
    
    expect(nameResult.isOk()).toBe(false);
    expect(nameResult.isErr()).toBe(true);
    
    if (nameResult.isErr()) {
      expect(nameResult.error).toContain('inte vara längre än');
    }
  });
  
  it('ska misslyckas för ett namn med otillåtna tecken', () => {
    const nameResult = TeamName.create('Team <script>alert("hack")</script>');
    
    expect(nameResult.isOk()).toBe(false);
    expect(nameResult.isErr()).toBe(true);
    
    if (nameResult.isErr()) {
      expect(nameResult.error).toContain('endast innehålla');
    }
  });
  
  it('ska jämföra två identiska namn som lika', () => {
    const name1Result = TeamName.create('Testteam');
    const name2Result = TeamName.create('Testteam');
    
    expect(name1Result.isOk() && name2Result.isOk()).toBe(true);
    
    if (name1Result.isOk() && name2Result.isOk()) {
      const name1 = name1Result.value;
      const name2 = name2Result.value;
      
      expect(name1.equals(name2)).toBe(true);
    }
  });
  
  it('ska jämföra två olika namn som olika', () => {
    const name1Result = TeamName.create('Testteam1');
    const name2Result = TeamName.create('Testteam2');
    
    expect(name1Result.isOk() && name2Result.isOk()).toBe(true);
    
    if (name1Result.isOk() && name2Result.isOk()) {
      const name1 = name1Result.value;
      const name2 = name2Result.value;
      
      expect(name1.equals(name2)).toBe(false);
    }
  });
}); 