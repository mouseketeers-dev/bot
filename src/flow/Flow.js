import createDebug from "../utils/debug";
import StepLoadError from "../errors/step-load-error";
import Step from "./step";

const debug = createDebug("flow");

/**
 * Creates a runnable flow.
 * @param flow can be a single step (Step instance or function), or an array of steps
 * @param configs
 * @returns async function(ctx, next)
 */
export async function createFlow(flow, configs) {
  if (Array.isArray(flow)) {
    let source, fn;

    if (flow.length === 1 && Array.isArray(flow[0])) {
      source = flow[0];
      fn = createLoop;
    } else {
      source = flow;
      fn = createSequence;
    }

    const steps = [];
    for (const element of source) {
      steps.push(await createFlow(element, configs));
    }

    return fn(steps);

  } else {
    let stepConfig;

    if (flow.prototype instanceof Step) {
      stepConfig = configs[flow.configKey];
    } else if (typeof flow === "function") {
      stepConfig = configs[flow.name];
    } else {
      throw new StepLoadError(flow.name, 'Unknown step function type! Found: () => ' + JSON.stringify(flow));
    }

    return Step.newInstance(flow, stepConfig);
  }
}

function createSequence(steps) {
  /**
   * @see https://github.com/koajs/compose/blob/master/index.js
   */
  return function sequence(ctx, next) {
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

function createLoop(steps) {
  const sequence = createSequence(steps);

  return async function loop(ctx, next) {
    while (!ctx.break) {
      await sequence(ctx);
    }

    return next();
  };
}
  
