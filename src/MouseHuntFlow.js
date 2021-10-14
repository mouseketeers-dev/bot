import PrepareBrowser from "./flow/steps/PrepareBrowser";
import PreparePage from "./flow/steps/PreparePage";
import PrepareCycle from "./flow/steps/PrepareCycle";
import ClosePopups from "./flow/steps/ClosePopups";
import CheckMaintenance from "./flow/steps/CheckMaintenance";
import HourlyTrapCheck from "./flow/steps/HourlyTrapCheck";
import SoundHorn from "./flow/steps/SoundHorn";
import CheckKingReward from "./flow/steps/CheckKingReward";
import UpdateEnvironment from "./flow/steps/UpdateEnvironment";

const MouseHuntFlow = [
  PrepareBrowser,
  PreparePage,
  [[
    PrepareCycle,
    ClosePopups,
    CheckMaintenance,
    HourlyTrapCheck,
    SoundHorn,
    CheckKingReward,
    UpdateEnvironment
  ]]
];

export default MouseHuntFlow;
