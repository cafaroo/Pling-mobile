// Enkel polyfill för Node.js crypto-modulen
class Crypto {
  constructor() {}

  // Simulerar randomBytes funktion
  randomBytes(size) {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }

  // Simulerar createHash funktion
  createHash() {
    return {
      update: function() {
        return this;
      },
      digest: function() {
        return 'simulated-hash';
      }
    };
  }
}

// Exportera alla simulerade funktioner
const crypto = new Crypto();

module.exports = {
  randomBytes: (size) => crypto.randomBytes(size),
  createHash: (algorithm) => crypto.createHash(algorithm),
  subtle: {
    digest: async () => new Uint8Array(32)
  },
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
}; 