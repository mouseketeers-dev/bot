import Step from "./step";

import createDebug from "../utils/debug";

const debug = createDebug("flow");

/**
 *
 * @param stepNames
 * @param stepConfigs
 * @returns {Promise<function()>}
 */
async function createFlow(stepNames, configs) {
  const steps = [];

  for (const stepName of stepNames) {
    debug("loading step: " + stepName);

    const step = await Step.tryLoadStep(stepName, configs);
    steps.push(step);
  }

  /**
   * @see https://github.com/koajs/compose/blob/master/index.js
   */
  return function flow(ctx, next) {
    let lastIndex = -1;

    const dispatch = (index) => {
      if (index <= lastIndex) return Promise.reject(new Error('next() called multiple times'));
      lastIndex = index;

      let fn = (index < steps.length) ? steps[index] : next;
      if (!fn) return Promise.resolve();

      try {
        return Promise.resolve(fn(ctx, dispatch.bind(null, index + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    };

    return dispatch(0);
  };
}

export default {
  createFlow
};
