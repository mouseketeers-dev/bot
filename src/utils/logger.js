/**
 * A smart logger that can cache logs and display them only when they are marked important.
 *
 * Log blocks can be opened/closed and nested. If `log(data)` is called, the current and all parent nesting blocks will
 * be marked as important, and the logs from these blocks will be displayed.
 *
 * For example:
 * ```
 * [ A,
 *   [B],
 *   [C, info(C1)],
 *   [D, info(D1), info(D2),
 *     [E, log(E1), info(E2)]
 *   ],
 *   A1,
 *   [F, info(F1)],
 *   [G, info(G1), log(G2), info(G3)]
 * ]
 * ```
 *
 * - A, B, C… are blocks opened with open(X). At the end of each block, close() is called.
 * - Block B, C… are nested inside A, E is nested inside D.
 * - B and C are either empty or not containing important log (info logs are non-important), so their logs are not being
 *   displayed.
 * - Although D contains only info logs, block E inside it has one important log E1, which flushes these logs to the screen:
 *   ```
 *   A, D, D1, D2, E, E1
 *   ```
 *   Block A, D and E are also marked important, so E2 will also be displayed. Note that E isn't nested inside B and C,
 *   so logs from B and C are ignored.
 * - Since A is marked important, A1 will be displayed to the screen.
 * - Block F is a new block, so by default its non-important logs are not displayed.
 * - Block G contains important log G2, so its contents will be displayed.
 *
 * After this, the resulting displayed logs are:
 * ```
 * A, D, D1, D2, E, E1, A1, G, G1, G2, G3
 * ```
 */
export default class Logger {
  constructor() {
    this.currentLogBlock = null;
  }

  open(data) {
    this.currentLogBlock = new LogBlock(this.currentLogBlock);
    if (data !== undefined) { this.info(data); }
  }

  close(data) {
    this.currentLogBlock = this.currentLogBlock?.close(data);
  }

  info(data) {
    this.currentLogBlock?.append(data, false);
  }

  log(data) {
    this.currentLogBlock?.append(data, true);
  }
}

class LogBlock {
  constructor(parent) {
    this.important = false;
    this.parent = parent;
    this.level = this.parent ? this.parent.level + 1 : 0;
    this.cachedLogs = [];
  }

  append(data, important = false) {
    if (data instanceof Error) {
      data = data.stack;
    }

    if (important || this.important) {
      let block = this;
      let cachedLogsFromRoot = [...this._format(data, this.level)];

      // Traverse up to root 
      while (block && !block.important) {
        // prepend parents' cached logs to cachedLogsFromRoot
        cachedLogsFromRoot.unshift(...this._format(block.cachedLogs, block.level));
        block.cachedLogs = [];

        block.important = true; // mark parent as important as well
        block = block.parent; // move to parent
      }

      console.log(cachedLogsFromRoot.join("\n"));
    } else {
      this.cachedLogs.push(data);
    }
  }

  _format(data, level) {
    if (!data) return "";

    if (typeof data === "string" && data.includes("\n")) {
      data = data.split("\n");
    }

    function formatSingleLog(log) {
      log = log.toString();
      const effectiveLevel = Math.max(0, log.startsWith("[") ? level - 1 : level);
      return ' '.repeat(effectiveLevel * 2) + log;
    }

    if (Array.isArray(data)) {
      return data.map(formatSingleLog);
    } else {
      return [formatSingleLog(data)];
    }
  }

  close(data) {
    if (data) this.append(data);
    this.cachedLogs = null;
    return this.parent;
  }
}
