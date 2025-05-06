// Samlingsfil för alla Node.js polyfills i en React Native-app

// Importera process först för att göra den globalt tillgänglig
require('./process-polyfill');

// Lista över alla Node.js-moduler som kan behöva polyfills i React Native
const nodeModules = {
  // Core modules vi redan har skapat polyfills för
  stream: require('./stream-polyfill.js'),
  crypto: require('./crypto-polyfill.js'),
  events: require('./events-polyfill.js'),
  http: require('./http-polyfill.js'),
  
  // Path är särskilt viktig för Metro bundler
  path: require('./path-polyfill.js'),
  
  // Ytterligare vanliga moduler som kan behövas
  https: require('./http-polyfill.js'), // Använder samma implementation som http
  
  // Process måste vara tillgänglig globalt
  process: global.process,
  
  // Minimal Buffer implementation
  buffer: {
    Buffer: {
      from: (data, encoding) => {
        if (typeof data === 'string') {
          return new Uint8Array([...data].map(char => char.charCodeAt(0)));
        }
        return new Uint8Array(data);
      },
      alloc: (size) => new Uint8Array(size),
      isBuffer: (obj) => obj instanceof Uint8Array
    }
  },
  
  // Vanliga process-relaterade moduler
  os: {
    platform: () => 'browser',
    tmpdir: () => '/tmp',
    EOL: '\n'
  },
  
  // module modulen är ganska svår att polyfilla
  util: {
    types: {
      isArrayBuffer: (obj) => obj instanceof ArrayBuffer
    },
    inherits: (ctor, superCtor) => {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    },
    format: (format, ...args) => {
      if (typeof format !== 'string') return '';
      
      return format.replace(/%[sdij]/g, (match) => {
        const arg = args.shift();
        if (arg === undefined) return match;
        return String(arg);
      });
    }
  },
  
  // tty modulen (terminal)
  tty: {
    isatty: () => false,
  },
  
  // net modulen för nätverksrelaterad kod
  net: {
    isIP: () => 0,
    Socket: class Socket extends require('./events-polyfill') {
      connect() { return this; }
      end() { return this; }
    }
  },
  
  // fs-modulen för filsystem (väldigt minimal)
  fs: {
    readFileSync: () => { throw new Error('fs.readFileSync not implemented in React Native'); },
    writeFileSync: () => { throw new Error('fs.writeFileSync not implemented in React Native'); }
  },
  
  // zlib för komprimering
  zlib: {
    createGzip: () => ({ on: () => {}, write: () => {}, end: () => {} }),
    createGunzip: () => ({ on: () => {}, write: () => {}, end: () => {} }),
  }
};

// Exportera alla polyfills
module.exports = nodeModules; 