// Enkel polyfill för Node.js stream-modulen
class Stream {
  constructor() {
    this.readable = false;
    this.writable = false;
  }

  pipe() {
    return this;
  }
}

class PassThrough extends Stream {
  constructor() {
    super();
    this.readable = true;
    this.writable = true;
  }

  write(data) {
    return true;
  }

  end() {}
}

module.exports = {
  Stream,
  PassThrough,
  Readable: Stream,
  Writable: Stream,
  Duplex: Stream,
  Transform: PassThrough
}; 