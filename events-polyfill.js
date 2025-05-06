// Enkel polyfill för Node.js events-modulen (EventEmitter)
class EventEmitter {
  constructor() {
    this._events = {};
  }

  on(type, listener) {
    this._events[type] = this._events[type] || [];
    this._events[type].push(listener);
    return this;
  }

  addListener(type, listener) {
    return this.on(type, listener);
  }

  once(type, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.removeListener(type, onceWrapper);
    };
    this.on(type, onceWrapper);
    return this;
  }

  off(type, listener) {
    return this.removeListener(type, listener);
  }

  removeListener(type, listener) {
    if (!this._events[type]) return this;
    
    const idx = this._events[type].indexOf(listener);
    if (idx !== -1) {
      this._events[type].splice(idx, 1);
    }
    return this;
  }

  removeAllListeners(type) {
    if (type) {
      delete this._events[type];
    } else {
      this._events = {};
    }
    return this;
  }

  emit(type, ...args) {
    if (!this._events[type]) return false;
    
    this._events[type].forEach(listener => {
      listener.apply(this, args);
    });
    return true;
  }

  listenerCount(type) {
    return this._events[type] ? this._events[type].length : 0;
  }

  listeners(type) {
    return this._events[type] ? [...this._events[type]] : [];
  }
}

// Exportera EventEmitter som standardexport och som en namngiven export
module.exports = EventEmitter;
module.exports.EventEmitter = EventEmitter; 