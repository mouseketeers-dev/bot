import moment from 'moment';
import HuntTriggeringStep from "../HuntTriggeringStep";

export default class HourlyTrapCheck extends HuntTriggeringStep {

  initialize(config) {
    this.trapCheckMinutes = config["trapCheckMinutes"];
    this.nextTrapCheckTime = this.computeNextTrapCheckTime();
  }

  async guard() {
    // Only run this step if trap check time is reached
    return moment().isAfter(this.nextTrapCheckTime);
  }

  async run(ctx, next) {
    const { logger, page } = ctx;

    await page.reload();
    this.nextTrapCheckTime = this.computeNextTrapCheckTime();
    logger.log("Page reloaded for trap check. Next trap check: " + this.nextTrapCheckTime.format("HH:mm:ss"));

    return next();
  }

  computeNextTrapCheckTime() {
    let now = moment();
    // 5-second delay in case the server's time is not accurate
    let ret = moment().minutes(this.trapCheckMinutes).seconds(5);

    if (ret.isBefore(now)) {
      ret.add(1, 'hour');
    }

    return ret;
  }
}

