import HuntTriggeringStep from "../HuntTriggeringStep";
import {sleep} from "../../utils/helpers";

export default class SoundHorn extends HuntTriggeringStep {

  guard({ page }) {
    return page.$eval("#envHeaderImg a.mousehuntHud-huntersHorn", el => el["offsetHeight"] > 0);
  }

  async run(ctx, next) {
    const { page, logger } = ctx;

    logger.log("Clicking horn…");

    await page.evaluate("HuntersHorn.sound()");

    logger.log("Waiting for response…");
    await page.waitForSuccessfulResponse("activeturn.php"); //TODO: timeout fix 
    await sleep("2s");

    //TODO: add random delay
    logger.log("Done!");

    return next();
  }
}

