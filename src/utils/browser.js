import fetch from "node-fetch";
import puppeteer from "puppeteer";
import {promises as fs} from 'fs';
import path from 'path';

import InvalidConfigError from "../errors/invalid-config-error";
import BrowserError from "../errors/browser-error";

import {BLANK_LINE, coalesce, sleep, getTempFolder} from "./helpers";
import createDebug from "./debug";

const debug = createDebug("browser");

//TODO: clean browser profile
// https://github.com/puppeteer/puppeteer/issues/866
// https://github.com/puppeteer/puppeteer/issues/1791
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4427.0 Safari/537.36";

const Modes = {
  Window: "window",
  Headless: "headless",
  DevTools: "devtools"
};

export default {
  initializePage
};

async function initializePage(browserConfig, userFolderPath, instanceName) {
  const mode = coalesce(
    process.env.BROWSER_MODE,
    browserConfig.mode
  ).toLowerCase();

  const { userDataDir, cookiesPath } = initializeConstants(userFolderPath, instanceName);

  const browser = await prepareBrowser(mode, browserConfig, userDataDir);

  browser.on("disconnected", () => {
    console.log("Browser is closed! Stopping bot…");
    process.exit(0);
  });

  const currentPages = await browser.pages();
  const page = currentPages.length > 0 ? currentPages[0] : await browser.newPage();

  if (mode !== Modes.DevTools) await setCookies(page, cookiesPath);
  if (mode === Modes.Headless) await page.setUserAgent(USER_AGENT);

  if (mode !== Modes.Headless && browserConfig["prefixTitleWithFirstName"]) {
    await prefixTitleWithFirstName(page);
  }

  let currentUrl = await page.url();

  if (!currentUrl.includes("www.mousehuntgame.com")) {
    await tryLoadingMouseHunt(page);
  }

  currentUrl = await page.url();

  if (currentUrl.endsWith("login.php")) {
    await waitForLogin(page, mode, {
      username: process.env.MOUSEHUNT_USERNAME || browserConfig.username,
      password: process.env.MOUSEHUNT_PASSWORD || browserConfig.password
    });

    await saveCookies(page, cookiesPath);
  } else if (!currentUrl.endsWith("camp.php")) {
    throw new BrowserError("Expecting 'camp.php' but found: " + currentUrl);
  }

  const user = await page.evaluate("window.user");
  if (user) {
    console.log(BLANK_LINE);
    console.log(`Camp loaded! User: ${user.username}, location: ${user["environment_name"]}.`);
    console.log(BLANK_LINE);
  }

  return page;
}

function initializeConstants(userFolderPath, instanceName) {
  const userDataDir = instanceName ? getTempFolder("puppeteer_dev_chrome_profile-" + instanceName) : null;

  debug("Chrome profile folder:" + userDataDir);

  const cookiesFile = coalesce(
    process.env.COOKIES,
    instanceName ? `cookies_${instanceName}.json` : "cookies.json"
  );
  const cookiesPath = path.resolve(userFolderPath, cookiesFile);

  debug("Cookies file: " + cookiesFile);
  debug("Cookies path: " + cookiesPath);

  return {
    userDataDir, cookiesFile, cookiesPath
  };
}


//region Browsers

async function prepareBrowser(mode, browserConfig, userDataDir) {
  const config = browserConfig?.[mode] || {};
  let browser;

  switch (mode) {
    case Modes.Window:
      browser = await openWindowBrowser(config, userDataDir);
      break;

    case Modes.Headless:
      browser = await openHeadlessBrowser(config, userDataDir);
      break;

    case Modes.DevTools:
      browser = await openDevToolsBrowser(config);
      break;

    default:
      throw new InvalidConfigError(`Unknown value "${mode}" for "browser.mode".`);
  }

  return browser;
}

async function tryLoadingMouseHunt(page, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto('https://www.mousehuntgame.com', {
        waitUntil: 'networkidle0'
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

    console.error("Unable to load page!");
  }

}

//TODO: use proxy-chain to block ads: https://github.com/apify/proxy-chain#anonymizeproxyproxyurl-callback
function openWindowBrowser(windowConfig, userDataDir) {
  const launchConfig = {
    headless: false,
    defaultViewport: null,
  };

  const browserPath = windowConfig["browserPath"];

  if (browserPath) {
    launchConfig.executablePath = browserPath;
  }

  console.log("Opening browser…");
  return puppeteer.launch(launchConfig);
}

async function openHeadlessBrowser(headlessConfig, userDataDir) {
  const launchConfig = {
    headless: true,
    defaultViewport: { width: 1024, height: 768 },
    userDataDir: userDataDir,
    args: ['--no-sandbox', '--disable-gpu']
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

//endregion

//region Setup & Login

async function waitForLogin(page, mode, credentials) {
  const { username, password } = credentials;
  if (username && password) {
    console.log(`Logging in using username '${username}'…`);
    await page.evaluate("app.pages.LoginPage.showSignIn()");

    await sleep("2s");
    await page.type(".scrollingContainer.login input.username", username);
    await page.type(".scrollingContainer.login input.password", password);

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
}

async function isFileAccessible(fileUrl) {
  try {
    await fs.access(fileUrl);
    return true;
  } catch (err) {
    return false;
  }
}

async function setCookies(page, cookiesPath) {
  const cookiesFile = path.basename(cookiesPath);

  if (await isFileAccessible(cookiesPath)) {
    try {
      const cookiesString = (await fs.readFile(cookiesPath)).toString();
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
      console.log(`Cookies loaded from "${cookiesFile}".`);
    } catch (err) {
      console.error("Unable to read cookies!");
      console.error(err);
    }
  } else {
    console.log("No cookies file found.");
  }
}

async function saveCookies(page, cookiesPath) {
  const cookies = await page.cookies();
  await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));

  const cookiesFile = path.basename(cookiesPath);
  console.log(`Cookies saved to "${cookiesFile}".`);
}

//endregion
