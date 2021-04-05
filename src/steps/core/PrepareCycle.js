import moment from "moment";
import {sleep} from "../../utils/helpers";
import puppeteer from "puppeteer";

const { TimeoutError } = puppeteer;

export default (config) => async function prepareCycle(ctx, next) {
  const { page, state, logger } = ctx;

  logger.open(`[start] - ${moment().format("DD/MM/YYYY HH:mm:ss")}`);
  state.cycleDelay = config["cycleDelay"];

  try {
    state.lastJournalId = await page.latestJournalId();
    await next();
    logger.close("[end]\n");
  } catch (ex) {
    logger.log("Encountered error:");
    console.error(ex);

    if (ex instanceof TimeoutError) {
      //TODO: add count for timeouterror
      console.log("Page reloaded. Restart cycle in 1m.");
      await page.reload();
      state.cycleDelay = "1m";
    } else if (ex.message.includes("Execution context was destroyed")) {
      // this is likely due to the page just randomly restarting
      await page.reload();
    } else {
      process.exit(1);
    }
  }

  await sleep(state.cycleDelay);
}
