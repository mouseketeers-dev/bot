import util from 'util';
import path from "path";
import url from "url";
import {deepMerge, coalesce, loadYamlSync} from "../utils/helpers";
import createDebug from "../utils/debug";

const debug = createDebug("config");

export const INSTANCE_NAME = process.env.name || null;

const BASE_SETTINGS_FILE = process.env.BASE_SETTINGS?.trim() || "settings.yml";
debug("Base settings file: " + BASE_SETTINGS_FILE);

// if base_settings is a file, resolve it to "user" folder.
// if it's an absolute path, use that path instead.
export const BASE_SETTINGS_FOLDER_URL = (() => {
  const folder = path.dirname(BASE_SETTINGS_FILE);
  if (folder === ".") {
    return new URL("../../user/", import.meta.url);
  } else {
    return url.pathToFileURL(folder + "/");
  }
})();

debug("Settings folder: " + BASE_SETTINGS_FOLDER_URL);

export const USER_SETTINGS_FILE = coalesce(
  process.env.USER_SETTINGS?.trim(),
  (INSTANCE_NAME ? `settings_${INSTANCE_NAME}.yml` : null)
);

if (USER_SETTINGS_FILE) {
  debug("User settings file: " + USER_SETTINGS_FILE);
}

function load() {
  try {
    const defaultConfig = loadYamlSync(new URL("default.yml", import.meta.url));

    const baseConfigUrl = new URL(BASE_SETTINGS_FILE, BASE_SETTINGS_FOLDER_URL);
    let baseConfig = loadYamlSync(baseConfigUrl, {});

    let userConfig = {};

    if (USER_SETTINGS_FILE) {
      const userConfigUrl = new URL(USER_SETTINGS_FILE, BASE_SETTINGS_FOLDER_URL);
      userConfig = loadYamlSync(userConfigUrl, {});
    }

    const mergedConfig = deepMerge(defaultConfig, baseConfig, userConfig);

    return Object.freeze(mergedConfig);
  } catch (e) {
    console.error("Unable to read config!");
    console.error(e);
    process.exit(1);
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
