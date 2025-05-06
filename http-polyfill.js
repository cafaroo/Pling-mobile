// Enkel polyfill för Node.js http-modulen
const EventEmitter = require('./events-polyfill');

class ServerResponse extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
    return this;
  }

  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }

  removeHeader(name) {
    delete this.headers[name.toLowerCase()];
    return this;
  }

  write(chunk) {
    this.emit('data', chunk);
    return true;
  }

  end(data) {
    if (data) {
      this.write(data);
    }
    this.emit('end');
    return this;
  }
}

class ServerRequest extends EventEmitter {
  constructor(method, url) {
    super();
    this.method = method || 'GET';
    this.url = url || '/';
    this.headers = {};
  }
}

class Server extends EventEmitter {
  constructor(requestListener) {
    super();
    this.listening = false;
    if (requestListener) {
      this.on('request', requestListener);
    }
  }

  listen(port, callback) {
    this.port = port;
    this.listening = true;
    if (callback) {
      callback();
    }
    return this;
  }

  close(callback) {
    this.listening = false;
    if (callback) {
      callback();
    }
    return this;
  }
}

module.exports = {
  createServer: (requestListener) => new Server(requestListener),
  Server,
  ServerRequest,
  ServerResponse,
  request: () => {
    const req = new EventEmitter();
    req.end = () => req;
    return req;
  },
  get: (url, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
    }
    const req = module.exports.request();
    if (callback) {
      setImmediate(() => {
        const res = new ServerResponse();
        callback(res);
        res.emit('end');
      });
    }
    return req;
  }
}; 