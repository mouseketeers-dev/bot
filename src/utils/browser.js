import fetch from "node-fetch";
import puppeteer from "puppeteer";
import {promises as fs} from 'fs';
import InvalidConfigError from "../errors/invalid-config-error";
import BrowserError from "../errors/browser-error";
import {BLANK_LINE, coalesce, sleep} from "./helpers";
import config, {BASE_SETTINGS_FOLDER_URL, INSTANCE_NAME} from "../config";
import createDebug from "./debug";

const debug = createDebug("browser");

//TODO: clean browser profile
// https://github.com/puppeteer/puppeteer/issues/866

const COOKIES_FILE = coalesce(
  process.env.COOKIES,
  config.browser["cookies"],
  INSTANCE_NAME ? `cookies_${INSTANCE_NAME}.json` : "cookies.json"
);
const COOKIES_URL = new URL(COOKIES_FILE, BASE_SETTINGS_FOLDER_URL);
const { MOUSEHUNT_USERNAME, MOUSEHUNT_PASSWORD } = process.env;

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4427.0 Safari/537.36";

const Modes = {
  Window: "window",
  Headless: "headless",
  DevTools: "devtools"
};

debug("Cookies file: " + COOKIES_FILE);
debug("Cookies url: " + COOKIES_URL);

export default {
  initializePage
};

async function initializePage(browserConfig) {
  const mode = coalesce(
    process.env.BROWSER_MODE,
    browserConfig.mode
  ).toLowerCase();

  const config = browserConfig[mode] || {};
  let browser;

  switch (mode) {
    case Modes.Window:
      browser = await openWindowBrowser(config);
      break;

    case Modes.Headless:
      browser = await openHeadlessBrowser(config);
      break;

    case Modes.DevTools:
      browser = await openDevToolsBrowser(config);
      break;

    default:
      throw new InvalidConfigError(`Unknown value "${mode}" for "browser.mode".`);
  }

  browser.on("disconnected", () => {
    console.log("Browser is closed! Stopping bot…");
    process.exit(0);
  });

  const currentPages = await browser.pages();
  const page = currentPages.length > 0 ? currentPages[0] : await browser.newPage();
  const currentUrl = await page.url();

  if (mode !== Modes.DevTools) await setCookies(page);
  if (mode === Modes.Headless) await page.setUserAgent(USER_AGENT);

  if (mode !== Modes.Headless && browserConfig["prefixTitleWithFirstName"]) {
    await prefixTitleWithFirstName(page);
  }

  if (!currentUrl.includes("www.mousehuntgame.com")) {
    await tryLoadingMouseHunt(page);
  }

  await checkForCamp(page, mode);

  const user = await page.evaluate("window.user");
  if (user) {
    console.log(BLANK_LINE);
    console.log(`Camp loaded! User: ${user.username}, location: ${user["environment_name"]}.`);
    console.log(BLANK_LINE);
  }

  return page;
}

//region Browsers

async function tryLoadingMouseHunt(page, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto('https://www.mousehuntgame.com', {
        waitUntil: 'networkidle0'
      });

      return;
    } catch (err) {
      if (err.message.includes("Navigation timeout")) {
        console.log("Timeout! Retrying to load page…");
        // this is ok, continue until retries exhausted.
      } else {
        throw err;
      }
    }

    console.error("Unable to load page!");
  }

}

//TODO: use proxy-chain to block ads: https://github.com/apify/proxy-chain#anonymizeproxyproxyurl-callback
function openWindowBrowser(windowConfig) {
  const launchConfig = {
    headless: false,
    defaultViewport: null
  };

  const browserPath = windowConfig["browserPath"];

  if (browserPath) {
    launchConfig.executablePath = browserPath;
  }

  console.log("Opening browser…");
  return puppeteer.launch(launchConfig);
}

async function openHeadlessBrowser(headlessConfig) {
  const launchConfig = {
    headless: true,
    defaultViewport: { width: 1024, height: 768 }
  };

  console.log("Opening headless browser…");
  return puppeteer.launch(launchConfig);
}

async function openDevToolsBrowser(devToolsConfig) {
  const port = devToolsConfig.port;

  if (!port) {
    throw new InvalidConfigError(`Config "browser.devtools.port" is required.`);
  }

  let wsEndpoint;

  try {
    const devToolInfo = await fetch(`http://localhost:${port}/json/version`).then(body => body.json());
    wsEndpoint = devToolInfo["webSocketDebuggerUrl"];
  } catch (err) {
    console.error("Unable to connect to DevTools!");
    console.error(err);
    process.exit(1);
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsEndpoint,
    defaultViewport: null,
  });

  console.log("Connected to: " + wsEndpoint);

  return browser;
}

function prefixTitleWithFirstName(page) {
  return page.evaluateOnNewDocument((userSettingsName) => {
    let prefixed = false;

    document.addEventListener('DOMContentLoaded', function () {
      const target = document.querySelector('title');
      if (prefixed || !target) return;

      const observer = new MutationObserver(prefixTitle);

      function prefixTitle() {
        if (!document.title.startsWith("[")) {
          observer.disconnect();
          const name = window.user ? window.user["firstname"] : userSettingsName;
          document.title = `[${name}] ${document.title}`;
          observer.observe(target, { childList: true });
        }
      }

      setTimeout(prefixTitle, 1000);
      prefixed = true;
    });
  }, INSTANCE_NAME);
}

//endregion

//region Setup & Login

async function checkForCamp(page, mode) {
  const currentUrl = await page.url();

  if (currentUrl.endsWith("camp.php")) {
    // okay
  } else if (currentUrl.endsWith("login.php")) {
    await waitForLogin(page, mode);
  } else {
    throw new BrowserError("Expecting 'camp.php' but found: " + currentUrl);
  }
}

async function waitForLogin(page, mode) {
  if (MOUSEHUNT_USERNAME && MOUSEHUNT_PASSWORD) {
    console.log(`Logging in using username '${MOUSEHUNT_USERNAME}'…`);
    await page.evaluate("app.pages.LoginPage.showSignIn()");

    await sleep("2s");
    await page.type(".scrollingContainer.login input.username", MOUSEHUNT_USERNAME);
    await page.type(".scrollingContainer.login input.password", MOUSEHUNT_PASSWORD);

    await sleep("1s");
    await page.evaluate("app.pages.LoginPage.loginHitGrab()");

    const response = await page.waitForResponse(res => res.url().includes("session.php") && res.status() === 200);
    const resJson = await response.json();

    if (!resJson["success"]) {
      throw new BrowserError("Unable to login: " + resJson["login_error"]);
    }
  } else if (mode === Modes.Headless) { // we can't wait for manual login in headless mode
    throw new BrowserError("Unable to login! Please provide cookies or username and password.");
  } else {
    console.log("Please log in! Waiting for camp…");
  }

  await page.waitForFunction(() => document.body.classList.contains('PageCamp'), { timeout: 0 });
  await saveCookies(page);
}

async function isFileAccessible(fileUrl) {
  try {
    await fs.access(fileUrl);
    return true;
  } catch (err) {
    return false;
  }
}

async function setCookies(page) {
  if (await isFileAccessible(COOKIES_URL)) {
    try {
      const cookiesString = (await fs.readFile(COOKIES_URL)).toString();
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
      console.log(`Cookies loaded from "${COOKIES_FILE}".`);
    } catch (err) {
      console.error("Unable to read cookies!");
      console.error(err);
    }
  } else {
    console.log("No cookies file found.");
  }
}

async function saveCookies(page) {
  const cookies = await page.cookies();
  await fs.writeFile(COOKIES_URL, JSON.stringify(cookies, null, 2));
  console.log(`Cookies saved to "${COOKIES_FILE}".`);
}

//endregion
