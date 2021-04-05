export default class FlowError extends Error {
  constructor(message) {
    super(message);
    if (Error.captureStackTrace) { Error.captureStackTrace(this, FlowError); }
    this.name = this.constructor.name;
  }
}
