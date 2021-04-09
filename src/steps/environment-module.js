import Step from "./step";
import util from "util";

export default class EnvironmentModule extends Step {

  constructor() {
    super();
    this.cache = {};
  }

  getCache(key) {
    return this.cache[key];
  }

  hasValueChanged(key, newValue) {
    const cachedValue = this.cache[key];

    if (cachedValue !== newValue) {
      this.cache[key] = newValue;
      return true;
    } else {
      return false;
    }
  }

  async armSetup({ page, logger }, setup, name) {
    if (setup) {
      await page.armItems(setup);
      logger.log(`Changed to ${name}: ${util.inspect(setup)}`);
    } else {
      logger.log(`No ${name} in config. Skipping…`);
    }
  }

  build() {
    return async (ctx) => {
      const { logger } = ctx;

      logger.open(`[${this.name}]`);

      if (await this.shouldRun(ctx)) {
        await this.run(ctx);
      }

      logger.close();
    };
  }

}
