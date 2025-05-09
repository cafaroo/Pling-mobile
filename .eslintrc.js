module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    // Våra anpassade regler
    'result-api/no-deprecated-methods': 'warn',
    
    // Övriga regler
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      rules: {
        'result-api/no-deprecated-methods': 'warn',
      },
    },
  ],
  // Våra anpassade plugins
  plugins: [
    '@typescript-eslint', 
    'react', 
    'react-hooks', 
    'result-api'
  ],
  // Definiera våra egna plugins
  overrideRules: {
    'result-api': {
      processors: [],
      rules: {
        'no-deprecated-methods': require('./eslint-result-rule'),
      },
    },
  },
}; 