import NotImplementedError from "../errors/not-implemented-error";
import StepLoadError from "../errors/step-load-error";

export default class Step {

  constructor() {
    this.cache = {};
  }

  getCache(key) {
    return this.cache[key];
  }

  hasCacheChanged(key, newValue) {
    const cachedValue = this.cache[key];

    if (cachedValue !== newValue) {
      this.cache[key] = newValue;
      return true;
    } else {
      return false;
    }
  }

  get name() {
    return this.constructor.name;
  }

  /**
   * Return false to skip this step.
   * @returns {(boolean|Promise<boolean>)}
   */
  shouldRun(ctx) {
    return true;
  }

  /**
   * This will run once when the app starts.
   */
  initialize(config) {
  }

  build() {
    return async (ctx, next) => {
      const { logger } = ctx;
      logger.open(`[${this.name}]`);

      if (next) {
        const closeBlockThenNext = () => {
          logger.close();
          return next();
        };

        if (!await this.shouldRun(ctx)) return closeBlockThenNext();
        await this.run(ctx, closeBlockThenNext);

      } else {
        if (await this.shouldRun(ctx)) {
          await this.run(ctx);
        }

        logger.close();
      }
    };
  }

  async run(ctx, next) {
    throw new NotImplementedError("Step.run() must be implemented.");
  }

  /**
   * @returns {Promise<function>}
   */

  static async tryLoadStep(name, configs, folder = "core") {
    const stepUrl = new URL(folder + "/" + name + ".js", import.meta.url).toString();
    let module;

    try {
      module = await import(stepUrl);
    } catch (err) {
      throw new StepLoadError(name, err.message);
    }

    if (!module.default) {
      throw new StepLoadError(name, 'Unable to find "default" function in step definition.');
    } else {
      module = module.default;
    }

    if (module.prototype instanceof Step) {
      const step = new module();
      await step.initialize(configs[name]);
      return step.build();

    } else if (typeof module === "function") {
      const step = module(configs[name]);

      if (typeof step === "function") {
        return step;
      } else {
        throw new StepLoadError(name, 'Unknown step function type! Found: () => ' + JSON.stringify(step));
      }

    } else {
      throw new StepLoadError(name, 'Unknown step type! Found: ' + JSON.stringify(module));
    }
  }
}
