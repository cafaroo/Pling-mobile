// Detta är en setup-fil för att konfigurera JSDOM-miljön för React-tester

// Import jest-dom för att lägga till matchers som toBeInTheDocument
import '@testing-library/jest-dom';

// Sätt upp globala variabler som används i JSDOM
global.MutationObserver = class {
  constructor(callback) {}
  disconnect() {}
  observe(element, initObject) {}
};

// Hantera matchMedia som saknas i JSDOM
global.matchMedia = global.matchMedia || function(query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
};

// Dessa behövs för React Native-komponenterna
global.window = global.window || {};
global.window.addEventListener = jest.fn();
global.window.removeEventListener = jest.fn();

// Mockade JSDOM-funktioner som inte används men krävs av vissa tester
Object.defineProperty(global, 'requestAnimationFrame', {
  writable: true,
  value: (callback) => setTimeout(callback, 0),
});

Object.defineProperty(global, 'cancelAnimationFrame', {
  writable: true,
  value: (id) => clearTimeout(id),
}); 