#!/usr/bin/env node

/**
 * Result API Verifiering
 * 
 * Detta skript kör verifiering av Result-API-användning i kodbasen och genererar en rapport.
 * Skriptet returnerar felkod om det hittar förekomster av det gamla API:et.
 * 
 * Användning:
 *   node runVerification.js
 *   
 * Flaggor:
 *   --no-report   Generera inte rappportfil
 *   --help        Visa hjälptext
 */

// Använd en vanlig require eftersom detta är ett JS-skript som kan köras direkt
// ts-node behövs inte för detta enkla skript
const path = require('path');

// Parsa kommandoradsargument
const args = process.argv.slice(2);
const generateReport = !args.includes('--no-report');
const showHelp = args.includes('--help');

if (showHelp) {
  console.log(`
Result API Verifiering

Detta skript kör verifiering av Result-API-användning i kodbasen och genererar en rapport.
Skriptet returnerar felkod om det hittar förekomster av det gamla API:et.

Användning:
  node runVerification.js

Flaggor:
  --no-report   Generera inte rappportfil
  --help        Visa hjälptext
  `);
  process.exit(0);
}

// Kör verifieringen via ts-node
const { execSync } = require('child_process');

try {
  console.log('Startar Result-API-verifiering...');
  
  // Kör verifieringsskriptet via ts-node
  const cmd = `npx ts-node ${path.join(__dirname, 'resultApiVerificationTest.ts')} ${generateReport ? '' : '--no-report'}`;
  
  // Kör kommandot och visa output i realtid
  execSync(cmd, { stdio: 'inherit' });
  
  console.log('Verifiering klar utan problem!');
  process.exit(0);
} catch (error) {
  console.error('Verifiering misslyckades!');
  
  if (error.status) {
    process.exit(error.status);
  } else {
    process.exit(1);
  }
} 