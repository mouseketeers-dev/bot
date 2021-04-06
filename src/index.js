import fs from "fs";

import config, {USER_SETTINGS_FILE} from './config';
import browser from './utils/browser';
import flow from "./steps/flow";
import server from "./server";

import State from "./utils/state";
import Logger from "./utils/logger";
import MouseHuntPage from "./utils/mousehunt-page";

async function main() {
  const page = await browser.initializePage(config["browser"]);
  const mhPage = MouseHuntPage.wrap(page);
  server.start(config.server?.port, mhPage);

  await startFlow(mhPage);
}

function showBanner() {
  const banner = fs.readFileSync(new URL("banner.txt", import.meta.url), "utf-8");
  const { version } = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8"));
  console.log(banner.replace("$", version));
}

async function startFlow(page) {
  const flowSteps = config["flow"];
  const mainFlow = await flow.createFlow(flowSteps, config);

  const state = new State();
  const logger = new Logger();
  const ctx = { page, state, logger };

  while (true) {
    await mainFlow(ctx);
  }
}

showBanner();

console.log(`Config loaded from: "${USER_SETTINGS_FILE}".`);

main()
  .then(() => console.log("Done!"))
  .catch(err => {
    console.error(err.stack);
    process.exit(-1);
  });
