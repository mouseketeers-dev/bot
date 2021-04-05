import {inspect} from './config';
import tryLoadStep from "./steps/step-loader";

(async () => {
  tryLoadStep('PrepareCycle').then(s => console.log(s));
})();


