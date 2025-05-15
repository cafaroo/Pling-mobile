import { TeamName } from '../TeamName';

describe('TeamName', () => {
  it('ska skapa ett giltigt TeamName', () => {
    const nameResult = TeamName.create('Testteam');
    expect(nameResult.isSuccess).toBe(true);
    
    if (nameResult.isSuccess) {
      const name = nameResult.getValue();
      expect(name.value).toBe('Testteam');
      expect(name.toString()).toBe('Testteam');
    }
  });
  
  it('ska trimma bort överflödiga mellanslag', () => {
    const nameResult = TeamName.create('   Testteam   ');
    expect(nameResult.isSuccess).toBe(true);
    
    if (nameResult.isSuccess) {
      expect(nameResult.getValue().value).toBe('Testteam');
    }
  });
  
  it('ska misslyckas för ett kort namn', () => {
    const nameResult = TeamName.create('A');
    expect(nameResult.isSuccess).toBe(false);
    expect(nameResult.isFailure).toBe(true);
    
    if (nameResult.isFailure) {
      expect(nameResult.error).toContain('minst 2 tecken');
    }
  });
  
  it('ska misslyckas för ett för långt namn', () => {
    // Skapa ett väldigt långt namn
    const longName = 'A'.repeat(101);
    const nameResult = TeamName.create(longName);
    
    expect(nameResult.isSuccess).toBe(false);
    expect(nameResult.isFailure).toBe(true);
    
    if (nameResult.isFailure) {
      expect(nameResult.error).toContain('inte vara längre än');
    }
  });
  
  it('ska misslyckas för ett namn med otillåtna tecken', () => {
    const nameResult = TeamName.create('Team <script>alert("hack")</script>');
    
    expect(nameResult.isSuccess).toBe(false);
    expect(nameResult.isFailure).toBe(true);
    
    if (nameResult.isFailure) {
      expect(nameResult.error).toContain('endast innehålla');
    }
  });
  
  it('ska jämföra två identiska namn som lika', () => {
    const name1Result = TeamName.create('Testteam');
    const name2Result = TeamName.create('Testteam');
    
    expect(name1Result.isSuccess && name2Result.isSuccess).toBe(true);
    
    if (name1Result.isSuccess && name2Result.isSuccess) {
      const name1 = name1Result.getValue();
      const name2 = name2Result.getValue();
      
      expect(name1.equals(name2)).toBe(true);
    }
  });
  
  it('ska jämföra två olika namn som olika', () => {
    const name1Result = TeamName.create('Testteam1');
    const name2Result = TeamName.create('Testteam2');
    
    expect(name1Result.isSuccess && name2Result.isSuccess).toBe(true);
    
    if (name1Result.isSuccess && name2Result.isSuccess) {
      const name1 = name1Result.getValue();
      const name2 = name2Result.getValue();
      
      expect(name1.equals(name2)).toBe(false);
    }
  });
}); 