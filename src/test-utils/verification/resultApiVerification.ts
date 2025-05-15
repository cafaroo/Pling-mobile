/**
 * ResultApiVerification
 * 
 * Detta hjälpverktyg verifierar att Result-API:et används konsekvent i hela kodbasen.
 * Det innehåller funktioner för att identifiera användning av det gamla API:et (isSuccess/getValue)
 * och rapportera filer som behöver uppdateras.
 */

import fs from 'fs';
import path from 'path';

// Mönster för att hitta användning av gamla Result-API:et
const OLD_API_PATTERNS = [
  /\.isSuccess\(\)/g,
  /\.isFailure\(\)/g,
  /\.getValue\(\)/g,
  /Result\.success\(/g,
  /Result\.failure\(/g
];

// Mönster för att hitta användning av nya Result-API:et
const NEW_API_PATTERNS = [
  /\.isOk\(\)/g, 
  /\.isErr\(\)/g, 
  /\.value/g,
  /Result\.ok\(/g,
  /\.err\(/g
];

interface FileAnalysisResult {
  filePath: string;
  usesOldApi: boolean;
  usesNewApi: boolean;
  oldApiMatches: {
    pattern: string;
    count: number;
    matches: string[];
  }[];
  needsMigration: boolean;
}

/**
 * Kontrollerar om en fil använder det gamla eller nya Result-API:et
 */
export function analyzeFile(filePath: string): FileAnalysisResult {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Filen finns inte: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Kontrollera användning av gamla API
  const oldApiMatches = OLD_API_PATTERNS.map(pattern => {
    const matches = content.match(pattern) || [];
    return {
      pattern: pattern.toString().replace(/\/g$/, '').replace(/^\//, ''),
      count: matches.length,
      matches: matches
    };
  }).filter(result => result.count > 0);
  
  // Kontrollera användning av nya API
  const newApiMatches = NEW_API_PATTERNS.some(pattern => pattern.test(content));
  
  return {
    filePath,
    usesOldApi: oldApiMatches.length > 0,
    usesNewApi: newApiMatches,
    oldApiMatches,
    needsMigration: oldApiMatches.length > 0
  };
}

/**
 * Skannar en katalog rekursivt efter filer som använder Result-API:et
 */
export function scanDirectory(
  dirPath: string, 
  extensions = ['.ts', '.tsx'],
  excludeDirs = ['node_modules', '.git', 'build', 'dist']
): FileAnalysisResult[] {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Katalogen finns inte: ${dirPath}`);
  }
  
  const results: FileAnalysisResult[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skippa exkluderade kataloger
      if (excludeDirs.includes(entry.name)) {
        continue;
      }
      
      // Rekursiv sökning i undermappar
      const subResults = scanDirectory(fullPath, extensions, excludeDirs);
      results.push(...subResults);
    } else if (entry.isFile()) {
      // Kontrollera endast filer med angivna tillägg
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        try {
          const fileResult = analyzeFile(fullPath);
          results.push(fileResult);
        } catch (error) {
          console.error(`Fel vid analys av ${fullPath}:`, error);
        }
      }
    }
  }
  
  return results;
}

/**
 * Genererar en sammanfattningsrapport över analysen
 */
export function generateReport(results: FileAnalysisResult[]): string {
  const filesWithOldApi = results.filter(r => r.usesOldApi);
  const filesWithMixedApi = results.filter(r => r.usesOldApi && r.usesNewApi);
  const filesWithNewApi = results.filter(r => r.usesNewApi && !r.usesOldApi);
  
  let report = `# Result-API Verifikationsrapport\n\n`;
  report += `Analys utförd: ${new Date().toISOString()}\n\n`;
  report += `Totalt antal analyserade filer: ${results.length}\n`;
  report += `Filer som använder gamla API:et: ${filesWithOldApi.length}\n`;
  report += `Filer som använder nya API:et: ${filesWithNewApi.length}\n`;
  report += `Filer som använder både gamla och nya API:et: ${filesWithMixedApi.length}\n\n`;
  
  if (filesWithOldApi.length > 0) {
    report += `## Filer som behöver migreras\n\n`;
    
    filesWithOldApi.forEach(file => {
      report += `### ${file.filePath}\n`;
      
      file.oldApiMatches.forEach(match => {
        report += `- ${match.pattern}: ${match.count} förekomster\n`;
      });
      
      report += `\n`;
    });
  } else {
    report += `## Alla filer använder nya Result-API:et!\n\n`;
    report += `Migreringen verkar vara komplett.\n`;
  }
  
  return report;
}

/**
 * Exporterar analysresultat till en Markdown-fil
 */
export function exportReportToFile(report: string, outputPath: string): void {
  const dir = path.dirname(outputPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, report, 'utf8');
  console.log(`Rapport exporterad till: ${outputPath}`);
} 