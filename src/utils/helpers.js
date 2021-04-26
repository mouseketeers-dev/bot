import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import os from "os";
import {v4 as uuidv4} from 'uuid';

export default {
  sleep
};

// Adding "blank character" so PM2 won't remove blank lines from streaming logs
// @see https://github.com/Unitech/pm2/issues/3237
export const BLANK_LINE = process.env.PM2_HOME ? "\u2800" : "";

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

export function loadYamlSync(fileUrl, defaultValue) {
  try {
    return yaml.load(fs.readFileSync(fileUrl));
  } catch (err) {
    if (defaultValue) return {}; else throw err;
  }
}

export function createTempFile(ext) {
  const fileName = uuidv4() + "." + ext;
  return path.resolve(os.tmpdir(), fileName);
}

export function getTempFolder(folderName) {
  return path.resolve(os.tmpdir(), folderName);
}

export function coalesce(...args) {
  for (const arg of args) {
    if (arg) return arg;
  }

  return null;
}

export function isFileAccessibleSync(fileUrl) {
  try {
    fs.accessSync(fileUrl);
    return true;
  } catch (err) {
    return false;
  }
}


const merge = (dest, src) => {
  for (const key of Object.keys(src)) {
    if (src[key] === null) continue;

    if (typeof src[key] !== "object" || Array.isArray(src[key])) {
      dest[key] = src[key];
    } else if (typeof src[key] === "object") {
      if (dest[key] === null || typeof dest[key] === "undefined") dest[key] = {};
      merge(dest[key], src[key]);
    }
  }
};

export function deepMerge(...objs) {
  const ret = {};

  for (const obj of objs) {
    merge(ret, obj);
  }

  return ret;
}
