import Step from "../step";
import config from "../../config";
import createDebug from "../../utils/debug";

const debug = createDebug("UpdateEnvironment");

export default class UpdateEnvironment extends Step {

  async initialize(modules) {
    if (!Array.isArray(modules)) modules = [];

    if (debug.enabled) {
      debug("Enabled modules: " + (modules.length === 0 ? "none" : modules.join(", ")));
    }

    const steps = [];

    for (const module of modules) {
      const step = await Step.tryLoadStep(module, config, "env");
      steps.push(step);
    }

    this.steps = steps;
  }

  shouldRun({ page, state }) {
    return page.hasNewJournal(state);
  }

  async run(ctx, next) {
    const { logger, page } = ctx;
    logger.log("New journal ID: " + await page.latestJournalId());

    for (const step of this.steps) {
      const user = await ctx.page.user();
      await step(Object.assign({}, ctx, { user }));
    }

    return next();
  }
}
