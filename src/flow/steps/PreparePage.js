import Step from "../step";
import path from "path";
import {promises as fs} from "fs";
import {Modes} from "../../utils/constants";
import {isFileAccessible} from "../../utils/helpers";
import BrowserError from "../../errors/browser-error";
import MouseHuntPage from "../../utils/mousehunt-page";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4427.0 Safari/537.36";

export default class PreparePage extends Step {

  get configKey() {
    return "browser";
  }

  initialize(config) {
    this.cookiesPath = config.cookiesPath;
    this.prefixTitleWithFirstName = config.prefixTitleWithFirstName;
  }

  async run(ctx, next) {
    const { browser, browserMode } = ctx;

    if (!browser) {
      console.log("browser must be initialized by 'PrepareBrowser'!");
      process.exit(1);
    }

    const currentPages = await browser.pages();
    const page = currentPages.length > 0 ? currentPages[0] : await browser.newPage();

    if (this.cookiesPath && browserMode !== Modes.DevTools) {
      await this.setCookies(page);
    }

    if (browserMode === Modes.Headless) {
      await page.setUserAgent(USER_AGENT);
    }

    if (this.prefixTitleWithFirstName && browserMode !== Modes.Headless) {
      await this.prefixTitleWithFirstName(page);
    }

    let currentUrl = await page.url();

    if (!currentUrl.includes("www.mousehuntgame.com")) {
      await this.tryLoadingMouseHunt(page);
    }

    ctx.browser = undefined; // we don't need the browser instance in the context anymore.
    ctx.page = MouseHuntPage.wrap(page);

    return next();
  }

  prefixTitleWithFirstName(page) {
    return page.evaluateOnNewDocument(() => {
      let prefixed = false;

      document.addEventListener('DOMContentLoaded', function () {
        const target = document.querySelector('title');
        if (prefixed || !target) return;

        const observer = new MutationObserver(prefixTitle);

        function prefixTitle() {
          if (!document.title.startsWith("[")) {
            observer.disconnect();
            const name = window?.user?.["firstname"] || "";
            document.title = `[${name}] ${document.title}`;
            observer.observe(target, { childList: true });
          }
        }

        setTimeout(prefixTitle, 1000);
        prefixed = true;
      });
    });
  }

  async setCookies(page) {
    if (await isFileAccessible(this.cookiesPath)) {
      try {
        const cookiesString = (await fs.readFile(this.cookiesPath)).toString();
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
        console.log(`Cookies loaded from "${path.basename(this.cookiesPath)}".`);
      } catch (err) {
        console.error("Unable to read cookies!");
        console.error(err);
      }
    } else {
      console.log("No cookies file found.");
    }
  }

  async tryLoadingMouseHunt(page, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await page.goto('https://www.mousehuntgame.com', {
          waitUntil: 'networkidle2'
        });

        return;
      } catch (err) {
        if (err.message.includes("timeout")) {
          console.log("Timeout! Retrying to load page…");
          // this is ok, continue until retries exhausted.
        } else {
          throw err;
        }
      }
    }

    throw new BrowserError("Unable to load page!");
  }

}

