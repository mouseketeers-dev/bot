import NotImplementedError from "../errors/not-implemented-error";
import StepLoadError from "../errors/step-load-error";
import createDebug from "../utils/debug";

const debug = createDebug("step");

export default class Step {

  get name() {
    return this.constructor.name;
  }

  get configKey() {
    return this.name;
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

      const closeLogBlockThenNext = () => {
        logger.close();
        return next();
      };

      if (!await this.shouldRun(ctx)) return closeLogBlockThenNext();
      await this.run(ctx, closeLogBlockThenNext);
    };
  }

  async run(ctx, next) {
    throw new NotImplementedError("Step.run() must be implemented.");
  }

  /**
   * Returns an async function(ctx, next)
   */
  static async newInstance(clazz, config) {
    debug("loading step: " + clazz.name);

    if (clazz.prototype instanceof Step) {
      const step = new clazz();
      await step.initialize(config);
      return step.build();

    } else if (typeof clazz === "function") {
      const step = clazz(config);

      if (typeof step === "function") {
        return step;
      } else {
        throw new StepLoadError(clazz.name, 'Unknown step function type! Found: () => ' + JSON.stringify(step));
      }

    } else {
      throw new StepLoadError(clazz.name, 'Unknown step type! Found: ' + JSON.stringify(clazz));
    }
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
      await step.initialize(configs[step.configKey]);
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
