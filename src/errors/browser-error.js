export default class BrowserError extends Error {
  constructor(message) {
    super(message);
    if (Error.captureStackTrace) { Error.captureStackTrace(this, BrowserError); }
    this.name = this.constructor.name;
  }
}
