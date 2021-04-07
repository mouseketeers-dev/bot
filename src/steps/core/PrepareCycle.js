import moment from "moment";
import {BLANK_LINE, sleep} from "../../utils/helpers";

export default (config) => async function prepareCycle(ctx, next) {
  const { page, state, logger } = ctx;

  logger.open(`[start] - ${moment().format("DD/MM/YYYY HH:mm:ss")}`);
  state.cycleDelay = config["cycleDelay"];

  try {
    state.lastJournalId = await page.latestJournalId();
    await next();
  } catch (ex) {
    console.log("Encountered error:");
    console.log(BLANK_LINE);
    console.error(ex);

    if (ex.message.includes("Timeout exceeded while waiting for event")) {
      //TODO: add count for TimeoutError
      logger.log("Reloading page due to timeout...");
      await page.reload();
      state.cycleDelay = "10s";
    } else if (ex.message.includes("Execution context was destroyed")) {
      // this is likely due to the page just randomly restarting
      logger.log("Reloading page due to navigation...");
      await page.reload();
    } else {
      console.log("Unrecoverable error. Exiting...");
      process.exit(1);
    }
  }

  logger.close("[end]\n" + BLANK_LINE);
  await sleep(state.cycleDelay);
}
