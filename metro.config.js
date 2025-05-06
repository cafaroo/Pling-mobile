const { getDefaultConfig } = require('expo/metro-config');

// Hämta standardkonfigurationen för Metro bundler
const defaultConfig = getDefaultConfig(__dirname);

// Blockera problematiska moduler
defaultConfig.resolver.blockList = [
  /node_modules\/ws\/lib\/.*/,
];

module.exports = defaultConfig; 