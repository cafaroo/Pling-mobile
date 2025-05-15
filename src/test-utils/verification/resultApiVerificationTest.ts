/**
 * Result API Verification Test
 * 
 * Detta test verifierar att Result-API används konsekvent i hela kodbasen.
 * Testet kommer att misslyckas om det hittar förekomster av det gamla API:et (isSuccess/getValue).
 */

import { scanDirectory, generateReport, exportReportToFile } from './resultApiVerification';
import path from 'path';

// Denna funktion kan köras för att verifiera Result-API-användning
export function verifyResultApiUsage(
  baseDir: string = process.cwd(),
  generateReportFile: boolean = true
): boolean {
  console.log('Verifierar Result-API-användning i kodbasen...');
  
  // Definiera katalogerna som ska verifieras
  const srcDir = path.join(baseDir, 'src');
  
  // Skanna kodbasen
  const results = scanDirectory(srcDir, ['.ts', '.tsx'], [
    'node_modules', 
    '.git', 
    'build', 
    'dist',
    'test-utils/verification' // Exkludera vårt verifieringsverktyg som innehåller API-mönster
  ]);
  
  // Generera rapport
  const report = generateReport(results);
  
  // Skriv rapport till fil
  if (generateReportFile) {
    const reportPath = path.join(baseDir, 'docs', 'testing', 'result-api-verification-report.md');
    exportReportToFile(report, reportPath);
  }
  
  // Skriv ut rapport till konsollen
  console.log(report);
  
  // Om testet ska returnera true/false baserat på om alla filer använder nya API:et
  const filesWithOldApi = results.filter(r => r.usesOldApi);
  const success = filesWithOldApi.length === 0;
  
  if (success) {
    console.log('Verifiering lyckades! Alla filer använder det nya Result-API:et.');
  } else {
    console.error(`Verifiering misslyckades! ${filesWithOldApi.length} filer använder fortfarande det gamla API:et.`);
  }
  
  return success;
}

// Om filen körs direkt, genomför verifieringen
if (require.main === module) {
  const success = verifyResultApiUsage();
  process.exit(success ? 0 : 1);
} 