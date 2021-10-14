import {createFlow} from "./flow/Flow";
import {sleep} from "./utils/helpers";

function createStep(name) {
  const fn = function (config) {
    return async function (ctx, next) {
      ctx.test += config.value;
      console.log(`inside ${name}, value = ${config.value}, test = ${ctx.test}`);
      await sleep(1000);
      return next();
    };
  };

  Object.defineProperty(fn, "name", { value: name });
  return fn;
}

const A = createStep("A");
const B = createStep("B");
const C = createStep("C");

const config = {
  A: { value: 1 },
  B: { value: 2 },
  C: { value: 3 }
};

const flowDef = [A, [[B, C]]];

(async function main() {
  const flow = await createFlow(flowDef, config);
  return flow({ test: 0 });
})();
