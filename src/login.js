/**
 * docker run --rm -it -v $PWD/user:/usr/bot/user -v $PWD/src:/usr/bot/src mouseketeers/bot:latest yarn run login
 */

import browser from "./utils/browser";
import readline from 'readline-promise';
import url from "url";

const rlp = readline.default.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

async function input(varName) {
  const value = await rlp.questionAsync(varName + " = ");
  if (!value) {
    console.log(varName + " cannot be empty! Exiting…");
    process.exit(0);
  }
  return value;
}

async function main() {
  const name = await input("Name");
  const username = await input("Username");
  const password = await input("Password");

  await browser.initializePage(
    { mode: "headless", username, password },
    url.fileURLToPath(new URL("../user/", import.meta.url)),
    name
  );
}

main().then(() => {
  console.log("Done!");
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

