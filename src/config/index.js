import util from 'util';
import path from "path";
import url from "url";
import {deepMerge, coalesce, loadYamlSync} from "../utils/helpers";
import createDebug from "../utils/debug";

const debug = createDebug("config");

export const INSTANCE_NAME = process.env.name?.trim() || null;

const BASE_SETTINGS_FILE = process.env.BASE_SETTINGS?.trim() || "settings.yml";
debug("Base settings file: " + BASE_SETTINGS_FILE);

// if base_settings is a file, resolve it to "user" folder.
// if it's an absolute path, use that path instead.
export const USER_FOLDER = (() => {
  const folder = path.dirname(BASE_SETTINGS_FILE);
  if (folder === ".") {
    return url.fileURLToPath(new URL("../../user/", import.meta.url));
  } else {
    return folder + "/";
  }
})();

export function getUserFolderPath(subPath) {
  return path.resolve(USER_FOLDER, subPath);
}

debug("Settings folder: " + USER_FOLDER);

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

    const baseConfigPath = getUserFolderPath(BASE_SETTINGS_FILE);
    let baseConfig = loadYamlSync(baseConfigPath, {});

    let userConfig = {};

    if (USER_SETTINGS_FILE) {
      const userConfigPath = getUserFolderPath(USER_SETTINGS_FILE);
      userConfig = loadYamlSync(userConfigPath, {});
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
