import moment from "moment";
import {BLANK_LINE, sleep} from "../../utils/helpers";
import FlowError from "../../errors/flow-error";

const MAX_CONSECUTIVE_RELOAD_COUNT = 5;

let consecutiveReloadCount = 0;

export default (config) => async function prepareCycle(ctx, next) {
  const { page, state, logger } = ctx;

  logger.open(`[start] - ${moment().format("DD/MM/YYYY HH:mm:ss")}`);
  state.cycleDelay = config["cycleDelay"];

  try {
    state.lastJournalId = await page.latestJournalId();
    await next();
    consecutiveReloadCount = 0; // reset reload count
  } catch (err) {
    logger.log(BLANK_LINE);
    logger.log("Encountered error:");
    logger.log(err);

    const shouldReload = handleError(err);

    if (!shouldReload) {
      console.log("Unrecoverable error. Exiting…");
      process.exit(1);
    } else if (consecutiveReloadCount >= MAX_CONSECUTIVE_RELOAD_COUNT) {
      console.log("Reloaded page too many times. Exiting…");
      process.exit(1);
    } else { // if (shouldReload) 
      console.log("Reloading page due to error…");
      await page.reload();
      consecutiveReloadCount += 1;
    }

  }

  logger.close("[end]\n" + BLANK_LINE, true);
  await sleep(state.cycleDelay);
}

/**
 * returns true if the page should be reloaded
 * @param error
 */
function handleError(error) {
  if (error.message.includes("Timeout exceeded while waiting for event")) {
    return true;
  } else if (error.message.includes("Execution context was destroyed")) {
    // this is likely due to the page just randomly restarting
    return true;
  } else if (error.message.includes("Navigation timeout")) {
    return true;
  } else if (error instanceof FlowError && error.shouldReload) {
    return true;
  } else {
    return false;
  }
}
