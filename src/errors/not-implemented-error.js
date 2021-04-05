export default class NotImplementedError extends Error {
  constructor(message) {
    super(message);
    if (Error.captureStackTrace) { Error.captureStackTrace(this, NotImplementedError); }
    this.name = this.constructor.name;
  }
}
