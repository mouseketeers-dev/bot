import Step from "../step";
import config from "../../config";
import createDebug from "../../utils/debug";
import {BLANK_LINE} from "../../utils/helpers";
import wordWrap from "word-wrap";

const debug = createDebug("UpdateEnvironment");

export default class UpdateEnvironment extends Step {

  async initialize(stepConfig) {
    this.shouldShowLatestHunt = stepConfig["showLatestHunt"];

    let modules = stepConfig.modules;

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

    if (this.shouldShowLatestHunt) {
      await this.showLatestHuntResult(ctx);
    }

    for (const step of this.steps) {
      const user = await ctx.page.user();
      await step(Object.assign({}, ctx, { user }));
    }

    return next();
  }

  async showLatestHuntResult(ctx) {
    const { logger, page } = ctx;

    const resultText = await page.evaluate(
      // Get the first hunt result entry, ignoring miscellaneous entries
      () => document.querySelector("#journalContainer .active .journaltext, #journalContainer .passive .journaltext")?.innerText
    );

    if (resultText) {
      const formattedText = wordWrap(resultText, { width: 60, indent: "> " });
      logger.log(formattedText);
    }
  }
}
