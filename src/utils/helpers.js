export default {
  sleep
};

export function parseTimespan(input) {
  const pattern = /([\d.]+)([dhms])/g;
  const multiplier = {
    d: 86400,
    h: 3600,
    m: 60,
    s: 1
  };

  let timespan = 0;
  let match;

  // Apply each matched magnitude-unit combination to the running total.
  while (match = pattern.exec(input)) {
    const magnitude = parseFloat(match[1]);
    const unit = match[2];
    timespan += (magnitude * multiplier[unit]);
  }

  return timespan;
}

export function sleep(timespan) {
  const ms = (typeof timespan === "number") ? timespan : parseTimespan(timespan) * 1000;
  return new Promise(resolve => setTimeout(resolve, ms));
}
