/**
 * @fileoverview ESLint-plugin för att kontrollera Result-API användning
 * @author Pling Team
 */
"use strict";

// Import regler
const noDeprecatedMethods = require('./eslint-result-rule');

// Exportera plugin
module.exports = {
  rules: {
    'no-deprecated-methods': noDeprecatedMethods
  },
  configs: {
    // Rekommenderad konfiguration
    recommended: {
      plugins: ['result-api'],
      rules: {
        'result-api/no-deprecated-methods': 'warn'
      }
    },
    // Strikt konfiguration
    strict: {
      plugins: ['result-api'],
      rules: {
        'result-api/no-deprecated-methods': 'error'
      }
    }
  }
}; 