import {LOG_BLANK_LINE} from "../utils/helpers";

export default class StepLoadError extends Error {
  constructor(stepName, message) {
    const msg = `Unable to load step "${stepName}"!` + LOG_BLANK_LINE + message;
    super(msg);

    if (Error.captureStackTrace) { Error.captureStackTrace(this, Error); }
    this.name = this.constructor.name;
  }
}
