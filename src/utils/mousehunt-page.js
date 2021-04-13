import db from "../data";

import createDebug from "./debug";

const debug = createDebug("MouseHuntPage");

export default class MouseHuntPage {

  constructor(page) {
    this.page = page;
  }

  static wrap(page) {
    return new MouseHuntPage(page);
  }

  get pptrPage() {
    return this.page;
  }

  //region Page related

  //TODO: update function signature to match original
  $eval(...args) {
    return this.page.$eval(...args);
  }

  evaluate(...args) {
    return this.page.evaluate(...args);
  }

  reload() {
    return this.page.reload({ waitUntil: "networkidle0" });
  }

  waitForSuccessfulResponse(urlFragment) {
    return this.page.waitForResponse(res => res.url().includes(urlFragment) && res.status() === 200);
  }

  hasElement(selector) {
    return this.page.$(selector).then(el => el !== null);
  }

  elementHasClass(selector, clazz) {
    return this.page.evaluate(
      (selector, clazz) => {
        const el = document.querySelector(selector);
        return el && el.classList.contains(clazz);
      }, selector, clazz);
  }

  waitForAnimationEnd(selector, timeout = 5000) {
    if (!selector) throw new Error("waitForAnimationEnd: selector must not be empty.");

    return this.page.evaluate((selector, timeout) => {
      return new Promise((resolve, reject) => {
        const el = document.querySelector(selector);
        let timer;

        function onAnimationEnd() {
          clearTimeout(timer);
          el.removeEventListener('animationend', onAnimationEnd);
          resolve();
        }

        function onTimeout() {
          clearTimeout(timer);
          el.removeEventListener('animationend', onAnimationEnd);
          reject(`waitForAnimationEnd has timed out after ${timeout}ms.`);
        }

        timer = setTimeout(onTimeout, timeout);
        el.addEventListener('animationend', onAnimationEnd);
      });
    }, selector, timeout);
  }

  waitForNetworkIdle({ timeout = 10000, waitForFirstRequest = 1000, waitForLastRequest = 500, maxInflightRequests = 0 } = {}) {
    const page = this.page;

    let inflight = 0;
    let resolve;
    let reject;
    let firstRequestTimeoutId;
    let lastRequestTimeoutId;
    let timeoutId;
    maxInflightRequests = Math.max(maxInflightRequests, 0);

    function cleanup() {
      clearTimeout(timeoutId);
      clearTimeout(firstRequestTimeoutId);
      clearTimeout(lastRequestTimeoutId);
      /* eslint-disable no-use-before-define */
      page.removeListener('request', onRequestStarted);
      page.removeListener('requestfinished', onRequestFinished);
      page.removeListener('requestfailed', onRequestFinished);
      /* eslint-enable no-use-before-define */
    }

    function check() {
      if (inflight <= maxInflightRequests) {
        clearTimeout(lastRequestTimeoutId);
        lastRequestTimeoutId = setTimeout(onLastRequestTimeout, waitForLastRequest);
      }
    }

    function onRequestStarted() {
      clearTimeout(firstRequestTimeoutId);
      clearTimeout(lastRequestTimeoutId);
      inflight += 1;
    }

    function onRequestFinished() {
      inflight -= 1;
      check();
    }

    function onTimeout() {
      cleanup();
      reject(new Error('Timeout'));
    }

    function onFirstRequestTimeout() {
      cleanup();
      resolve();
    }

    function onLastRequestTimeout() {
      cleanup();
      resolve();
    }

    // Ignore ads/analytics requests
    function filterRequest(fn) {
      return req => req.url().endsWith(".php") && fn();
    }

    page.on('request', filterRequest(onRequestStarted));
    page.on('requestfinished', filterRequest(onRequestFinished));
    page.on('requestfailed', filterRequest(onRequestFinished));

    timeoutId = setTimeout(onTimeout, timeout); // Overall page timeout
    firstRequestTimeoutId = setTimeout(onFirstRequestTimeout, waitForFirstRequest);

    return new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
  }

  //endregion

  //region MouseHunt related

  user() {
    return this.page.evaluate("window.user");
  }

  //TODO: sometimes this can be zero. should reload page
  async latestJournalId() {
    return this.page.evaluate("window.lastReadJournalEntryId");
  }

  hasNewJournal(state) {
    return this.latestJournalId().then(id => id !== state.lastJournalId);
  }

  hasKingReward() {
    return this.user().then(user => user["has_puzzle"]);
  }

  async armSingleItem(itemType, itemKey) {
    const item = db.getItem(itemKey, itemType);

    if (!item) {
      throw new TypeError(`Unknown item "${itemKey}"!`);
    }
    const apiItemType = db.getApiType(itemType);
    const currentlyArmedItemId = (await this.user())[apiItemType + "_item_id"];

    if (currentlyArmedItemId === item.id) {
      debug(`Item "${item.name}" is already armed. Skipping…`);
      return;
    }

    await this.page.evaluate((itemType, itemKey) => {
      return new Promise((resolve, reject) => {
        hg.utils.TrapControl.armItem(itemKey, itemType).go(resolve, reject);
      });
    }, apiItemType, item.key);

    debug(`Item "${item.name}" is now armed…`);
  }

  async armItems(setup) {
    for (const type of db.ItemTypes) {
      const item = setup[type];
      if (item) await this.armSingleItem(type, item);
    }
  }

  //endregion
}
