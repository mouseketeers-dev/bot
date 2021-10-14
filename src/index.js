import fs from "fs";

import config, {INSTANCE_NAME, USER_FOLDER} from './config';
import browser from './utils/browser';
import server from "./server";

import State from "./utils/state";
import Logger from "./utils/logger";
import MouseHuntPage from "./utils/mousehunt-page";
import {coalesce} from "./utils/helpers";

import {createFlow} from "./flow/flow";
import MouseHuntFlow from "./MouseHuntFlow";

// import SegfaultHandler from 'segfault-handler';


async function main() {
  const page = await browser.initializePage(config["browser"], USER_FOLDER, INSTANCE_NAME);
  const mhPage = MouseHuntPage.wrap(page);

  if (config.server?.port) {
    server.start(config.server.port, mhPage);
  }

  await startFlow(mhPage);
}

function showBanner() {
  const banner = fs.readFileSync(new URL("banner.txt", import.meta.url), "utf-8");
  const { version } = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8"));
  console.log(banner.replace("$", version));
}

async function startFlow(page) {
  const mainFlow = await createFlow(MouseHuntFlow, config);

  const state = new State();
  const logger = new Logger();
  const ctx = { page, state, logger };

  await mainFlow(ctx);
}

showBanner();
// SegfaultHandler.registerHandler(`${USER_SETTINGS_FILE_NO_EXT}-crash.log`);

main()
  .then(() => console.log("Done!"))
  .catch(err => {
    console.error(err.stack);
    process.exit(-1);
  });
