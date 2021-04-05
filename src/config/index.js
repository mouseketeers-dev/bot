import yaml from 'js-yaml';
import util from 'util';
import fs from 'fs';
import deepAssign from 'object-assign-deep';

function readFile(name) {
  try {
    return fs.readFileSync(new URL(name, import.meta.url));
  } catch (err) {
    return "";
  }
}

function load() {
  try {
    const defaultConfig = yaml.load(readFile("default.yml"));
    const userConfig = yaml.load(readFile("../../user/settings.yml"));

    const mergedConfig = deepAssign({}, defaultConfig, userConfig);

    return Object.freeze(mergedConfig);
  } catch (e) {
    console.error("Unable to read config!");
    console.error(e);
  }
}

const config = load();

export default config;

export function inspect() {
  console.log(util.inspect(config, { showHidden: false, depth: null }));
}
