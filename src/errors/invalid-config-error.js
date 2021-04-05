export default class InvalidConfigError extends Error {
  constructor(message) {
    super(message);
    if (Error.captureStackTrace) { Error.captureStackTrace(this, InvalidConfigError); }
    this.name = this.constructor.name;
  }
}
