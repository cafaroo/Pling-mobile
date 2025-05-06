// Mer komplett polyfill för Node.js path-modulen
const path = {
  sep: '/',
  delimiter: ':',
  
  basename: function(path, ext) {
    if (typeof path !== 'string') {
      throw new TypeError('The "path" argument must be of type string. Received ' + typeof path);
    }
    
    // Ta bort trailing slash
    let start = 0;
    let end = path.length - 1;
    
    while (end >= 0 && path[end] === path.sep) {
      end--;
    }
    
    // Hitta sista slash
    let i = end;
    while (i >= 0) {
      if (path[i] === path.sep) {
        start = i + 1;
        break;
      }
      i--;
    }
    
    // Extrahera basnamnet
    let basename = path.slice(start, end + 1);
    
    // Ta bort filändelsen om den finns och matchar ext
    if (ext && basename.endsWith(ext)) {
      basename = basename.slice(0, basename.length - ext.length);
    }
    
    return basename;
  },
  
  dirname: function(path) {
    if (typeof path !== 'string') {
      throw new TypeError('The "path" argument must be of type string. Received ' + typeof path);
    }
    
    if (path.length === 0) return '.';
    
    // Ta bort trailing slash
    let end = path.length - 1;
    while (end >= 0 && path[end] === path.sep) {
      end--;
    }
    
    // Hitta sista slash
    let i = end;
    while (i >= 0) {
      if (path[i] === path.sep) {
        break;
      }
      i--;
    }
    
    if (i < 0) return '.';
    
    // Ta bort trailing slash igen från resultatet
    let result = path.slice(0, i);
    end = result.length - 1;
    while (end >= 0 && result[end] === path.sep) {
      end--;
    }
    
    if (end < 0) return path.sep;
    
    return result.slice(0, end + 1);
  },
  
  extname: function(path) {
    if (typeof path !== 'string') {
      throw new TypeError('The "path" argument must be of type string. Received ' + typeof path);
    }
    
    // Hitta sista punkten efter sista slash
    let lastDotIndex = -1;
    let lastSlashIndex = -1;
    
    for (let i = path.length - 1; i >= 0; i--) {
      if (path[i] === '.' && lastDotIndex === -1) {
        lastDotIndex = i;
      } else if (path[i] === path.sep && lastSlashIndex === -1) {
        lastSlashIndex = i;
        break;
      }
    }
    
    if (lastDotIndex === -1 || lastDotIndex < lastSlashIndex || lastDotIndex === 0) {
      return '';
    }
    
    return path.slice(lastDotIndex);
  },
  
  join: function(...paths) {
    if (paths.length === 0) return '.';
    
    // Kontrollera att alla delar är strängar
    for (let i = 0; i < paths.length; i++) {
      if (typeof paths[i] !== 'string') {
        throw new TypeError('The "path" argument must be of type string. Received ' + (paths[i] === null ? 'null' : typeof paths[i]));
      }
    }
    
    let joined = paths.join(path.sep);
    
    // Normalisera path (ta bort extra slashes)
    let result = joined.replace(/\/+/g, '/');
    
    // Ta bort trailing slash
    if (result.length > 1 && result.endsWith(path.sep)) {
      result = result.slice(0, result.length - 1);
    }
    
    return result;
  },
  
  normalize: function(path) {
    if (typeof path !== 'string') {
      throw new TypeError('The "path" argument must be of type string. Received ' + typeof path);
    }
    
    if (path.length === 0) return '.';
    
    // Normalisera slashes
    let result = path.replace(/\/+/g, '/');
    
    // Ta bort trailing slash
    if (result.length > 1 && result.endsWith(path.sep)) {
      result = result.slice(0, result.length - 1);
    }
    
    return result;
  },
  
  resolve: function(...paths) {
    if (paths.length === 0) return process.cwd();
    
    // Kontrollera att alla delar är strängar
    for (let i = 0; i < paths.length; i++) {
      if (typeof paths[i] !== 'string') {
        throw new TypeError('The "path" argument must be of type string. Received ' + (paths[i] === null ? 'null' : typeof paths[i]));
      }
    }
    
    // Simulera process.cwd() om vi är i en React Native-miljö
    const cwd = '/';
    let resolvedPath = '';
    
    for (let i = paths.length - 1; i >= 0; i--) {
      let p = paths[i];
      
      // Ignorera tomma strängar
      if (p.length === 0) continue;
      
      resolvedPath = p + (resolvedPath ? `/${resolvedPath}` : '');
      if (resolvedPath[0] === '/') break;
    }
    
    // Om ingen del började med en slash, lägg till cwd
    if (resolvedPath[0] !== '/') {
      resolvedPath = `${cwd}/${resolvedPath}`;
    }
    
    return path.normalize(resolvedPath);
  }
};

module.exports = path; 