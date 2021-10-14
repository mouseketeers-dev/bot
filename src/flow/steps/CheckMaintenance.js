import Step from "../step";

export default class CheckMaintenance extends Step {

  initialize(config) {
    this.maintenanceCycleDelay = config["maintenanceCycleDelay"];
  }

  shouldRun({ page }) {
    return page.elementHasClass("body", "PageMaintenance");
  }

  async run(ctx, next) {
    const { logger, page, state } = ctx;

    logger.log("Maintenance detected.");
    await page.reload();
    state.cycleDelay = "10m"; // wait 10m for next cycle
    // not returning next() to restart the cycle
  }
}

