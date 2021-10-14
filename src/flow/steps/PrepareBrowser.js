import Step from "../step";
import {getTempFolder} from "../../utils/helpers";
import {Modes} from "../../utils/constants";
import InvalidConfigError from "../../errors/invalid-config-error";
import puppeteer from "puppeteer-extra";
import fetch from "node-fetch";

export default class PrepareBrowser extends Step {

  get configKey() {
    return "browser";
  }

  async initialize(config) {
    this.instanceName = config.instanceName;
    this.mode = config.mode;
    this.incognito = config.incognito;
    this.modeSpecificConfig = config?.[this.mode] || {};
  }

  async run(ctx, next) {
    this.chromeDataDir = this.instanceName ? getTempFolder("puppeteer_dev_chrome_profile-" + this.instanceName) : null;
    if (this.chromeDataDir) ctx.logger.log("Chrome profile folder:" + this.chromeDataDir);

    const browser = await this.createBrowserInstance();

    browser.on("disconnected", () => {
      console.log("Browser is closed! Stopping bot…");
      process.exit(0);
    });

    ctx.browserMode = this.mode;
    ctx.browser = this.incognito ? browser.createIncognitoBrowserContext() : browser;

    return next();
  }

  createBrowserInstance() {
    switch (this.mode) {
      case Modes.Window:
        return this.openWindowBrowser();

      case Modes.Headless:
        return this.openHeadlessBrowser();

      case Modes.DevTools:
        return this.openDevToolsBrowser();

      default:
        throw new InvalidConfigError(`Unknown value "${this.mode}" for "browser.mode".`);
    }
  }

  //TODO: use proxy-chain to block ads: https://github.com/apify/proxy-chain#anonymizeproxyproxyurl-callback
  openWindowBrowser() {
    const launchConfig = {
      headless: false,
      defaultViewport: null,
    };

    if (this.chromeDataDir) launchConfig.userDataDir = this.chromeDataDir;

    const browserPath = this.modeSpecificConfig["browserPath"];

    if (browserPath) {
      launchConfig.executablePath = browserPath;
    }

    console.log("Opening browser…");
    return puppeteer.launch(launchConfig);
  }

  async openHeadlessBrowser() {
    const launchConfig = {
      headless: true,
      defaultViewport: { width: 1024, height: 768 },
      // https://stackoverflow.com/questions/49008008/chrome-headless-puppeteer-too-much-cpu
      args: this.modeSpecificConfig?.args ?? []
    };

    if (this.chromeDataDir) launchConfig.userDataDir = this.chromeDataDir;

    console.log("Opening headless browser…");
    return puppeteer.launch(launchConfig);
  }

  async openDevToolsBrowser(devToolsConfig) {
    const port = this.modeSpecificConfig.port;

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


}

