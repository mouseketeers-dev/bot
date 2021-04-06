import util from 'util';
import deepAssign from 'object-assign-deep';
import path from "path";
import url from "url";
import {loadYaml} from "../utils/helpers";
import createDebug from "../utils/debug";

const debug = createDebug("config");

export const USER_SETTINGS_FILE = process.env.USER_SETTINGS?.trim() || "settings.yml";
debug("User settings file: " + USER_SETTINGS_FILE);

// if user_settings is a file, resolve it to "user" folder.
// if it's an absolute path, use that path instead.
export const USER_SETTINGS_FOLDER_URL = (() => {
  const folder = path.dirname(USER_SETTINGS_FILE);
  if (folder === ".") {
    return new URL("../../user/", import.meta.url);
  } else {
    return url.pathToFileURL(folder);
  }
})();
debug("User settings folder: " + USER_SETTINGS_FOLDER_URL);

function load() {
  try {
    const defaultConfig = loadYaml(new URL("default.yml", import.meta.url));

    const userConfigUrl = new URL(USER_SETTINGS_FILE, USER_SETTINGS_FOLDER_URL);
    let userConfig = loadYaml(userConfigUrl, {});

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
  return util.inspect(config, { showHidden: false, depth: null });
}

if (debug.enabled) {
  debug(inspect());
}

//inspect();
