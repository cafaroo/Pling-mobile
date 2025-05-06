// Förbättrad tom modul som ersätter Node.js moduler
// Denna modul returnerar ett proxy-objekt som hanterar alla anrop och tillgång till properties

// En funktion som alltid returnerar undefined
const noop = () => undefined;

// Skapar ett proxy-objekt som hanterar alla anrop och egenskaper
const handler = {
  get: function(target, prop) {
    // Om egenskapen är en funktion, returnera en tom funktion
    if (typeof target[prop] === 'function') {
      return target[prop];
    }
    
    // Om egenskapen inte finns, returnera ett nytt proxy-objekt
    // Detta gör att t.ex. 'crypto.createHash().update().digest()' fungerar
    return new Proxy(noop, handler);
  },
  apply: function(target, thisArg, args) {
    // När objekt anropas som en funktion, returnera ett nytt proxy-objekt
    return new Proxy(noop, handler);
  }
};

// Exportera ett proxy-objekt med en noop-funktion som mål
module.exports = new Proxy(noop, handler); 