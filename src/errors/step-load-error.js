export default class StepLoadError extends Error {
  constructor(stepName, message) {
    const msg = `Unable to load step "${stepName}"!\n` + message;
    super(msg);

    if (Error.captureStackTrace) { Error.captureStackTrace(this, Error); }
    this.name = this.constructor.name;
  }
}
