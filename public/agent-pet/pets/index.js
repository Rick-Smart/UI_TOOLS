import { sphynxCatBehavior } from "./sphynx-cat/logic.js";
import { jackRussellBehavior } from "./jack-russell/logic.js";
import { pidgeonBehavior } from "./pidgeon/logic.js";
import { redPandaBehavior } from "./red-panda/logic.js";
import { beaverBehavior } from "./beaver/logic.js";
import { chameleonBehavior } from "./chameleon/logic.js";
import { ferretBehavior } from "./ferret/logic.js";
import { fishBehavior } from "./fish/logic.js";
import { koalaBehavior } from "./koala/logic.js";
import { raccoonBehavior } from "./raccoon/logic.js";
import { seagullBehavior } from "./seagull/logic.js";
import { wolfBehavior } from "./wolf/logic.js";

const PET_BEHAVIOR_PROFILES = {
  "sphynx-cat": sphynxCatBehavior,
  "jack-russell": jackRussellBehavior,
  "pidgeon": pidgeonBehavior,
  "red-panda": redPandaBehavior,
  "beaver": beaverBehavior,
  "chameleon": chameleonBehavior,
  "ferret": ferretBehavior,
  "fish": fishBehavior,
  "koala": koalaBehavior,
  "raccoon": raccoonBehavior,
  "seagull": seagullBehavior,
  "wolf": wolfBehavior,
};

const DEFAULT_PET_ID = Object.keys(PET_BEHAVIOR_PROFILES)[0];

export function getPetBehaviorProfile(petId) {
  return PET_BEHAVIOR_PROFILES[petId] || PET_BEHAVIOR_PROFILES[DEFAULT_PET_ID];
}
