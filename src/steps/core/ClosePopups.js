import Step from "../step";
import {sleep} from "../../utils/helpers";

export default class ClosePopups extends Step {

  async run(ctx, next) {
    const { page, logger } = ctx;

    const isDailyRewardPopupVisible = await page.hasElement("div#overlayPopup.dailyRewardPopup");

    if (isDailyRewardPopupVisible) {
      logger.log("Closing daily reward…");
      await sleep("1s");
      await page.evaluate(() => {
        document.querySelector("#overlayPopup")?.replaceChildren(); // clear popup contents
        hg.views.MessengerView.go(); // clear overlay
      });
    }

    const isOnboardArrowVisible = await page.hasElement("#OnboardArrow");

    if (isOnboardArrowVisible) {
      const popupContent = await page.evaluate(() => document.querySelector("#OnboardArrow h2").textContent?.trim());
      logger.log("Popup: " + popupContent);
      logger.log("Closing onboard arrow…");
      await sleep("1s");
      await page.evaluate(() => {
        document.querySelector("#OnboardArrow")?.remove(); // remove arrow
      });
    }

    return next();
  }
}

