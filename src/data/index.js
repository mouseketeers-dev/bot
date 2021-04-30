import InvalidConfigError from "../errors/invalid-config-error";
import {loadYamlSync} from "../utils/helpers";
import {getUserFolderPath} from "../config";
import createDebug from "../utils/debug";

const debug = createDebug("data");

const database = {
  items: [],
  map: {}
};

const ItemTypes = ["weapon", "base", "charm", "bait"];

const ALIAS_URL = getUserFolderPath("alias.yml");
const aliases = loadYamlSync(ALIAS_URL, {});

debug("Alias file url: " + ALIAS_URL);

function loadItemFile({ fileName, itemType }) {
  const data = loadYamlSync(new URL(fileName, import.meta.url));

  if (!Array.isArray(data)) {
    throw new InvalidConfigError(`Expecting an array from "${fileName}", but found ${typeof data} instead."`);
  }

  for (const item of data) {
    const { name, key, id } = item;
    const dbItem = { name, key, id, type: itemType };
    database.items.push(dbItem);

    const alias = aliases[key];
    const aliasTokens = alias ? alias.split(",").map(s => s.trim().toLowerCase()) : [];

    addItemToMap(dbItem, [
      key.toLowerCase(),
      id,
      ...aliasTokens
    ]);
  }
}

function addItemToMap(item, keys) {
  const map = database.map;

  for (const key of keys) {
    const existingItem = map[key];
    if (existingItem) {
      throw new InvalidConfigError(`Both "${existingItem.name}" and "${item.name}" has the same key "${key}".`);
    }

    map[key] = item;
  }
}

for (const type of ItemTypes) {
  loadItemFile({ fileName: type + "s.yml", itemType: type });
}

function getItem(key, type) {
  const item = database.map[key.toLowerCase()];

  if (!item || (type && item.type !== type)) {
    throw new InvalidConfigError(`Unable to find ${type} "${key}"!`);
  }

  return item;
}

function verifySetup(setup) {
  if (!setup) return;

  for (const type of ItemTypes) {
    const itemKey = setup[type];
    if (!itemKey) continue;

    if (!getItem(itemKey, type)) {
      throw new InvalidConfigError(`Unknown ${type} "${itemKey}"!`);
    }
  }

  return setup;
}

function getApiType(type) {
  if (ItemTypes.includes(type)) {
    return type === "charm" ? "trinket" : type;
  } else {
    throw new TypeError(`Unsupported item type "${type}"!`);
  }
}

export default {
  getItem,
  verifySetup,
  ItemTypes,
  getApiType
};
