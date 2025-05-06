// Polyfill för Node.js process-modulen
const process = {
  env: {
    NODE_ENV: __DEV__ ? 'development' : 'production'
  },
  
  cwd: function() {
    return '/';
  },
  
  nextTick: function(callback, ...args) {
    setTimeout(() => {
      callback(...args);
    }, 0);
  },
  
  platform: 'react-native',
  
  version: 'v0.0.0',
  
  versions: {
    node: '0.0.0'
  },
  
  on: function() {
    // Ingen implementering behövs för React Native
  },
  
  hrtime: function() {
    return [0, 0];
  }
};

// Gör process globalt tillgänglig om det inte redan finns
if (typeof global.process === 'undefined') {
  global.process = process;
}

module.exports = process; 