/**
 * Result API Konsistenstest
 * 
 * Detta Jest-test verifierar att alla filer i kodbasen använder det nya Result-API:et (isOk/value)
 * konsekvent och att det inte finns några förekomster av det gamla API:et (isSuccess/getValue).
 */

import path from 'path';
import { scanDirectory } from '../resultApiVerification';

describe('Result API Konsistens', () => {
  // Definiera katalogen att analysera
  const srcDir = path.resolve(process.cwd(), 'src');
  
  // Exkludera verifieringsverktygen själva, eftersom de innehåller mönster för båda API:erna
  const excludeDirs = ['node_modules', '.git', 'build', 'dist', 'test-utils/verification'];
  
  it('ska använda det nya Result-API:et (isOk/value) konsekvent i hela kodbasen', () => {
    // Skanna kodbasen för att identifiera användning av gamla API:et
    const results = scanDirectory(srcDir, ['.ts', '.tsx'], excludeDirs);
    
    // Filtrera ut filer som använder gamla API:et
    const filesWithOldApi = results.filter(r => r.usesOldApi);
    
    // Skriv ut detaljinformation för alla filer som fortfarande använder gamla API:et
    if (filesWithOldApi.length > 0) {
      console.error('\nFöljande filer använder fortfarande det gamla Result-API:et:');
      
      filesWithOldApi.forEach(file => {
        console.error(`\n${file.filePath}:`);
        
        file.oldApiMatches.forEach(match => {
          console.error(`  - ${match.pattern}: ${match.count} förekomster`);
        });
      });
      
      console.error('\nTotalt antal filer med gamla API:et:', filesWithOldApi.length);
    }
    
    // Testet ska misslyckas om vi hittar några förekomster av gamla API:et
    expect(filesWithOldApi).toHaveLength(0);
  });
  
  it('ska ha minst en fil som använder det nya Result-API:et', () => {
    // Skanna kodbasen för att identifiera användning av nya API:et
    const results = scanDirectory(srcDir, ['.ts', '.tsx'], excludeDirs);
    
    // Filtrera ut filer som använder nya API:et
    const filesWithNewApi = results.filter(r => r.usesNewApi);
    
    // Vi förväntar oss att det finns åtminstone några filer som använder det nya API:et
    expect(filesWithNewApi.length).toBeGreaterThan(0);
  });
}); 