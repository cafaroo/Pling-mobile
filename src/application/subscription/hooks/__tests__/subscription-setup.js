// Setup-fil för subscription-testerna
// Detta är en enklare setup än jest.setup.js för att undvika beroendeproblem

import '@testing-library/jest-dom';

// Grundläggande globala mockar
global.fetch = jest.fn();

// Tysta alla console.warn i testmiljön
jest.spyOn(console, 'warn').mockImplementation(() => {});

// Spara originalet för att undvika oändlig rekursion
const originalError = console.error;

// Undvik varningar från React
jest.spyOn(console, 'error').mockImplementation((...args) => {
  // Tysta bara React-varningar, logga andra fel
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning:')) {
    return;
  }
  // Anropa originalet direkt för att undvika rekursion
  originalError.apply(console, args);
}); 