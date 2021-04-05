export default class State {
  constructor() {
    this.state = {};
  }

  set(key, value) {
    this.state[key] = value;
  }

  get(key) {
    return this.state[key];
  }

  get cycleDelay() {
    return this.get("cycleDelay");
  }

  set cycleDelay(value) {
    this.set("cycleDelay", value);
  }

  get lastJournalId() {
    return this.get("lastJournalId");
  }

  set lastJournalId(value) {
    this.set("lastJournalId", value);
  }
}
