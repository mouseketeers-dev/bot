import fetch from "node-fetch";
import Solver from "king-reward-solver";

import Step from "../step";
import FlowError from "../../errors/flow-error";
import {createTempFile, sleep} from "../../utils/helpers";
import fs from "fs/promises";

import createDebug from "../../utils/debug";
import InvalidConfigError from "../../errors/invalid-config-error";

const debug = createDebug("CheckKingReward");

export default class CheckKingReward extends Step {

  initialize(config) {
    this.maxRetry = config["maxRetry"];
    this.mode = config["mode"];

    if (!["buffer", "download"].includes(this.mode)) {
      throw new InvalidConfigError("CheckKingReward.mode must be either 'buffer' or 'download'.");
    }

    debug("mode = " + this.mode);

    return Solver.initialize();
  }

  shouldRun({ page }) {
    return page.hasKingReward();
  }

  async run(ctx, next) {
    const { logger, page, state } = ctx;

    // If King's Reward link appears in the banner after sounding horn, go to the puzzle page.
    if (await page.hasElement("#envHeaderImg div.mousehuntHud-huntersHorn-responseMessage > a")) {
      logger.log("Opening puzzle page…");
      await page.evaluate("hg.utils.PageUtil.setPage('Puzzle')");
    }

    logger.log("Solving captcha…");
    await this.solveCaptchaWithRetry(ctx);

    logger.log('Captcha solved!');
    await this.closePuzzlePage(ctx);

    state.cycleDelay = "1s"; // after solving King's Reward, start the next cycle right away to sound the horn if any.
    return next();
  }

  async solveCaptchaWithRetry(ctx) {
    const { logger, page } = ctx;

    for (let attempt = 0; attempt < this.maxRetry; attempt++) {
      const captchaBuffer = await this.fetchCurrentCaptcha(ctx);
      if (captchaBuffer === null) {
        throw new FlowError("Unable to load captcha!");
      }

      let captcha;

      try {
        logger.log(`Attempt #${attempt}:`);


        if (this.mode === "buffer") {
          captcha = await this.solveCaptchaByBuffer(captchaBuffer);
        } else if (this.mode === "download") {
          captcha = await this.solveCaptchaByDownload(captchaBuffer);
        }

        logger.log(`> Guess: ${captcha}`);

      } catch (e) {
        logger.log("Error while solving captcha: ");
        logger.log(e);
      }

      if (!captcha || captcha.length !== 5 || captcha.includes("?")) {
        logger.log('> Unable to solve, loading new captcha…');
        await this.loadNewCaptcha(ctx);
        continue;
      }

      logger.log('> Submitting…');
      await this.submitCaptcha(ctx, captcha);

      const hasKingReward = await page.hasKingReward();
      if (!hasKingReward) return;
    }

    throw new FlowError("Unable to solve captcha: max number of attempts exceeded.");
  }

  async solveCaptchaByBuffer(buffer) {
    return Solver.solve(buffer);
  }

  async solveCaptchaByDownload(buffer) {
    const captchaFile = await this.downloadCaptchaToFile(buffer);
    debug(`Captcha downloaded to ` + captchaFile);

    try {
      return Solver.solve(captchaFile);
    } finally {
      if (captchaFile) await fs.rm(captchaFile);
    }
  }

  async fetchCurrentCaptcha({ page, logger }) {
    try {
      const url = await page.$eval(".mousehuntPage-puzzle-form-captcha-image > img[src]", e => e["src"]);

      if (!url) return null;

      const res = await fetch(url);
      const buffer = await res.buffer();

      if (buffer.length === 0) return null;

      return buffer;
    } catch (err) {
      logger.log(err);
      return null;
    }
  }

  async downloadCaptchaToFile(buffer) {
    const captchaName = createTempFile("png");
    await fs.writeFile(captchaName, buffer);
    return captchaName;
  }

  async loadNewCaptcha({ page }) {
    await page.evaluate("app.views.HeadsUpDisplayView.hud.getNewPuzzle()");
    await page.waitForSuccessfulResponse("puzzleimage.php");
    await sleep("1s");
  }

  async submitCaptcha({ page, logger }, captcha) {
    await page.$eval(
      "#mousehuntHud input.mousehuntPage-puzzle-form-code",
      (el, text) => el.value = text, captcha
    );
    await sleep("1s");
    await page.evaluate("app.views.HeadsUpDisplayView.hud.submitPuzzleForm()");
    await page.waitForSuccessfulResponse("solvePuzzle.php");
    await sleep("1s");
  }

  async closePuzzlePage({ page }) {
    await page.evaluate("app.views.HeadsUpDisplayView.hud.resumeHunting()");
  }

  async fetchCaptchaWithDevTools({ page }) {
    /**
     * Get Chrome's resource using DevTools' Protocol
     * @see https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-getResourceContent
     * @see https://intoli.com/blog/saving-images/
     */
    const { content, base64Encoded } = await page._pptrPage._client.send(
      'Page.getResourceContent',
      { frameId: String(page.mainFrame()._id), url: url },
    );

    return Buffer.from(content, base64Encoded ? 'base64' : 'utf8');
  }
}

// async function downloadKR(page) {
//
//   for (let i = 1; i <= 200; i++) {
//     const captchaUrl = await page.$eval(".mousehuntPage-puzzle-form-captcha-image > img[src]", e => e.src);
//     const response = await fetch(captchaUrl);
//     const buffer = await response.buffer();
//     await fs.writeFile(`../output/captcha/${i}.png`, buffer);
//     await page.evaluate(() => app.views.HeadsUpDisplayView.hud.getNewPuzzle());
//     await helpers.sleep("1s");
//   }
// }
