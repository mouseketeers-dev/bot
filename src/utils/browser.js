import fetch from "node-fetch";
import puppeteer from "puppeteer";
import {promises as fs} from 'fs';
import InvalidConfigError from "../errors/invalid-config-error";
import BrowserError from "../errors/browser-error";
import {sleep} from "./helpers";
import config, {USER_SETTINGS_FOLDER_URL} from "../config";

const COOKIES_FILE = config.browser.cookiesFile || "cookies.json";
const COOKIES_URL = new URL(COOKIES_FILE, USER_SETTINGS_FOLDER_URL);
const { MOUSEHUNT_USERNAME, MOUSEHUNT_PASSWORD } = process.env;

export default {
  initializePage
};

async function initializePage(browserConfig) {
  const mode = browserConfig.mode?.toLowerCase();
  const config = browserConfig[mode] || {};
  let browser;

  switch (mode) {
    case "window":
      browser = await openWindowBrowser(config);
      break;

    case "headless":
      browser = await openHeadlessBrowser(config);
      break;

    case "devtools":
      browser = await openDevToolsBrowser(config);
      break;

    default:
      throw new InvalidConfigError(`Unknown value "${mode}" for "browser.mode".`);
  }

  browser.on("disconnected", () => {
    console.log("Browser is closed! Stopping bot…");
    process.exit(1);
  });

  const currentPages = await browser.pages();
  const page = currentPages.length > 0 ? currentPages[0] : await browser.newPage();
  const currentUrl = await page.url();

  if (mode !== "devtools") await setCookies(page);

  if (!currentUrl.includes("www.mousehuntgame.com")) {
    await page.goto('https://www.mousehuntgame.com', {
      waitUntil: 'networkidle0'
    });
  }

  await verifyCamp(page, mode);

  return page;
}

//region Browsers

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

//endregion

//region Setup & Login

async function verifyCamp(page, mode) {
  const currentUrl = await page.url();

  if (currentUrl.endsWith("camp.php")) {
    console.log("Camp loaded!\n");
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
  } else if (mode !== "devtools") {
    console.log("Please log in! Waiting for camp…");
  } else {
    throw new BrowserError("Unable to login! Please provide cookies or username and password.");
  }

  await page.waitForFunction(() => document.body.classList.contains('PageCamp'), { timeout: 0 });
  await saveCookies(page);

  console.log("Camp loaded!\n");
}


async function setCookies(page) {
  try {
    const cookiesString = (await fs.readFile(COOKIES_URL)).toString();
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    console.log(`Cookies loaded from 'user/${COOKIES_FILE}'.`);
  } catch (err) {
    console.log("No cookies are loaded.");
  }
}

async function saveCookies(page) {
  const cookies = await page.cookies();
  await fs.writeFile(COOKIES_URL, JSON.stringify(cookies, null, 2));
  console.log(`Cookies saved to 'user/${COOKIES_FILE}'.`);
}

//endregion
