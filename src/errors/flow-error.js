export default class FlowError extends Error {
  constructor(message, shouldReload = false) {
    super(message);
    if (Error.captureStackTrace) { Error.captureStackTrace(this, FlowError); }
    this.name = this.constructor.name;
    this._shouldReload = shouldReload;
  }

  get shouldReload() {
    return this._shouldReload;
  }
}
