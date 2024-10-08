import EnvironmentModule from "../environment-module";

import op from "object-path";
import db from "../../data";

export default class FloatingIslands extends EnvironmentModule {

  initialize(config) {
    this.config = config;
    this.paragonSetup = db.verifySetup(config["paragonSetup"]);
    this.wardenSetup = db.verifySetup(config["wardenSetup"]);
    this.launchPadSetup = db.verifySetup(config["launchPadSetup"]);
  }

  shouldRun({ user }) {
    return user["environment_type"] === "floating_islands";
  }

  async run(ctx) {
    const { user } = ctx;

    if (op.get(user, "enviroment_atts.on_island")) {
      await this.updateForIsland(ctx);
    } else {
      await this.updateForLaunchPad(ctx);
    }
  }

  //region Update

  async updateForIsland(ctx) {
    const { user, logger } = ctx;

    const enemyStatus = op.get(user, "enviroment_atts.enemy_state");
    const hasEnemyStatusChanged = this.hasValueChanged("enemyStatus", enemyStatus);

    const enemyName = op.get(user, "enviroment_atts.hunting_site_atts.enemy.name");
    const isHighAltitude = this.isHighAltitude(user);

    const {
      islandProgress, totalSteps,
      currentTileIndex, currentTileName
    } = this.getIslandProgress(user);

    if (enemyStatus === "enemyActive") { // encountering
      logger.log(`Encountering ${enemyName}!`);

      if (isHighAltitude) {
        await this.armSetup(ctx, this.paragonSetup, "Paragon setup");
      } else {
        await this.armSetup(ctx, this.wardenSetup, "Warden setup");
      }

    } else if (enemyStatus === "enemyDefeated") { // defeated
      if (hasEnemyStatusChanged) {
        logger.log(`Defeated ${enemyName}!`);
      } else {
        logger.log(`${enemyName} was already defeated. Staying on island.`);
      }

      await this.armSavedSetup(ctx);

      let shouldRetreat;
      const remainingHunts = op.get(user, "enviroment_atts.hunting_site_atts.hunts_remaining");
      const isIslandFullyExplored = this.isIslandFullyExplored(user);

      if (this.config["stayOnIslandAfterTrove"]) {
        shouldRetreat = remainingHunts === 0;
      } else {
        shouldRetreat = isIslandFullyExplored
          || (isHighAltitude && islandProgress < this.config["leaveHighIslandBeforeHunt"])
          || (!isHighAltitude && islandProgress < this.config["leaveLowIslandBeforeHunt"]);
      }

      if (shouldRetreat) {
        await this.retreat(ctx);
        logger.log("Retreated to launch pad!");
        await this.armSetup(ctx, this.launchPadSetup, "Launch Pad setup");
      } else if (!isIslandFullyExplored) {
        logger.log(`Current progress: ${islandProgress}/${totalSteps}.`);
      } else {
        logger.log(`Remaining hunts: ${remainingHunts}.`);
      }


    } else if (enemyStatus === "enemyApproaching") { // marching
      if (this.hasValueChanged("currentTileIndex", currentTileIndex)) {
        logger.log("Current tile: " + currentTileName + ".");
      }
    }
  }

  updateForLaunchPad(ctx) {

  }

  //endregion

  //region User state getters

  isHighAltitude(user) {
    return op.get(user, "enviroment_atts.hunting_site_atts.is_high_altitude");
  }

  getIslandProgress(user) {
    const huntingAttrs = op.get(user, "enviroment_atts.hunting_site_atts");

    const islandProgress = huntingAttrs["island_progress"];

    const huntPerTile = huntingAttrs["num_hunts_per_mod"];
    const currentTileIndex = Math.floor(islandProgress / huntPerTile);
    const currentTileName = huntingAttrs["island_mod_panels"][currentTileIndex]?.name;

    const totalSteps = huntPerTile * huntingAttrs["island_mod_panels"].length;

    return { islandProgress, totalSteps, currentTileIndex, currentTileName };
  }

  isIslandFullyExplored(user) {
    return op.get(user, "enviroment_atts.hunting_site_atts.is_island_fully_explored");
  }

  //endregion

  //region Actions

  async armSavedSetup({ logger, user, page }) {
    const savedSetupInfo = op.get(user, "enviroment_atts.saved_trap_setup");

    if (savedSetupInfo["has_setup"]) {    // only arm saved setup if it exists 
      if (!savedSetupInfo["is_active"]) { // and is not already armed
        await page.evaluate("hg.views.HeadsUpDisplayFloatingIslandsView.armSavedSetup()");
        logger.log("Saved setup armed.");
      }
    } else {
      logger.log("No saved setup found!");
    }

  }

  retreat({ page }) {
    return page.evaluate("hg.views.HeadsUpDisplayFloatingIslandsView.retreat()");
  }

  //endregion
}

const pirates = {
  "hunting_site_atts": {
    "num_hunts_per_mod": 10,
    "island_mod_panels": [
      {
        "type": "frost_shrine",
        "name": "Shrine of Frost",
        "description": "A shrine dedicated to the Warden of Frost!",
        "level": 1,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "+",
        "is_complete": true,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": null,
        "rewards": [],
        "has_rewards": null,
        "special_effect_description": {
          "short": "+1 Speed",
          "full": "Progress through the island faster."
        },
        "has_special_effect_description": true,
        "loot_cache_multiplier": 1,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null
      },
      {
        "type": "sky_pirates",
        "name": "Sky Pirate Den",
        "description": "PIRATES!",
        "level": 1,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "+",
        "is_complete": true,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": null,
        "rewards": [
          {
            "type": "sky_pirate_cheese_curd_crafting_item",
            "name": "Corsair's Curd",
            "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/c07822d0195ffbd72dfed12b647ea6b9.gif?cv=2",
            "quantity": 2,
            "loot_cache_quantity": 0,
            "total_quantity": 2
          }
        ],
        "has_rewards": true,
        "special_effect_description": {
          "short": "Pirates!",
          "full": "Unleashes Sky Pirate mice"
        },
        "has_special_effect_description": true,
        "loot_cache_multiplier": 1,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null
      },
      {
        "type": "sky_pirates",
        "name": "Sky Pirate Den",
        "description": "PIRATES!",
        "level": 2,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "x",
        "is_complete": true,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": null,
        "rewards": [
          {
            "type": "sky_pirate_cheese_curd_crafting_item",
            "name": "Corsair's Curd",
            "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/c07822d0195ffbd72dfed12b647ea6b9.gif?cv=2",
            "quantity": 2,
            "loot_cache_quantity": 0,
            "total_quantity": 2
          }
        ],
        "has_rewards": true,
        "special_effect_description": {
          "short": "Mo' Pirates!",
          "full": "Unleashes WAY TOO MANY Sky Pirate mice"
        },
        "has_special_effect_description": true,
        "loot_cache_multiplier": 1,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null
      },
      {
        "type": "gem_bonus",
        "name": "Sky Glass Formation",
        "description": "Provides a Sky Glass bonus to the mice on this island.",
        "level": 1,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": true
          }
        ],
        "sign": "x",
        "is_complete": true,
        "is_failed": null,
        "is_active": true,
        "is_enemy_active": null,
        "rewards": [
          {
            "type": "floating_islands_cloud_gem_stat_item",
            "name": "Sky Glass",
            "thumb": "https://www.mousehuntgame.com/images/items/stats/275d274836db81086a24e89f29de4cbf.gif?cv=2",
            "quantity": 2,
            "loot_cache_quantity": 0,
            "total_quantity": 2
          }
        ],
        "has_rewards": true,
        "special_effect_description": null,
        "has_special_effect_description": null,
        "loot_cache_multiplier": 1,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null
      }
    ],
    "island_loot": [
      {
        "type": "floating_islands_cloud_gem_stat_item",
        "name": "Sky Glass",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/275d274836db81086a24e89f29de4cbf.gif?cv=2",
        "quantity": 2
      },
      {
        "type": "floating_islands_sky_ore_stat_item",
        "name": "Sky Ore",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/246e7d6fc6f428b15effaf0b4200b838.gif?cv=2",
        "quantity": 1
      },
      {
        "type": "sky_pirate_cheese_curd_crafting_item",
        "name": "Corsair's Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/c07822d0195ffbd72dfed12b647ea6b9.gif?cv=2",
        "quantity": 4
      }
    ],
    "is_fuel_enabled": null,
    "is_island_fully_explored": true,
    "warden_stones": {
      "fog_shrine": null,
      "frost_shrine": true,
      "rain_shrine": true,
      "wind_shrine": null
    },
    "island_type": "hydro_island",
    "island_power_type": "hdr",
    "island_name": "Hydro Island",
    "island_name_indefinite_article": "a",
    "island_mod_types": [
      "frost_shrine",
      "sky_pirates",
      "sky_pirates",
      "gem_bonus"
    ],
    "activated_island_mod_types": [
      "frost_shrine",
      "sky_pirates",
      "sky_pirates",
      "gem_bonus"
    ],
    "island_progress": 40,
    "enemy_progress": 0,
    "hunts_remaining": 31,
    "sky_wardens_caught": 2,
    "is_high_tier_island": null,
    "is_high_altitude": null,
    "has_enemy": true,
    "enemy": {
      "id": 1031,
      "type": "frost_warden",
      "name": "Warden of Frost",
      "abbreviated_name": "Warden of Frost",
      "thumb": "https://www.mousehuntgame.com/images/mice/thumb/f74e1429b75c5aed568ea3ff188f626b.gif?cv=2"
    },
    "is_enemy_encounter": false,
    "has_encountered_enemy": true,
    "has_defeated_enemy": true,
    "enemy_encounter_hunts_remaining": 0,
    "one_time_reward": [
      {
        "type": "light_floating_loot_cache_convertible",
        "name": "Low Altitude Treasure Trove",
        "thumb": "https://www.mousehuntgame.com/images/items/convertibles/671b9528a32b0190c2579ec18830f594.gif?cv=2"
      },
      {
        "type": "sky_conqueror_egg_convertible",
        "name": "Sky Conqueror Egg",
        "thumb": "https://www.mousehuntgame.com/images/items/convertibles/91ca841f03e1710428ebe7c70f019102.gif?cv=2"
      }
    ],
    "has_treasure_trove": true
  },
  "airship": {
    "user_id": "7833142",
    "oculus_level": 8,
    "sail": {
      "type": "airship_sail_lny_ox_stat_item",
      "image": "https://www.mousehuntgame.com/images/ui/hud/floating_islands/airship/sail/airship_sail_lny_ox_stat_item.png"
    },
    "hull": {
      "type": "airship_hull_lny_ox_stat_item",
      "image": "https://www.mousehuntgame.com/images/ui/hud/floating_islands/airship/hull/airship_hull_lny_ox_stat_item.png"
    },
    "balloon": {
      "type": "airship_balloon_lny_ox_stat_item",
      "image": "https://www.mousehuntgame.com/images/ui/hud/floating_islands/airship/balloon/airship_balloon_lny_ox_stat_item.png"
    },
    "can_upgrade_oculus": null
  },
  "saved_trap_setup": {
    "can_arm_setup": true,
    "has_setup": true,
    "is_active": true,
    "items": {
      "base": {
        "type": "valour_rift_prestige_base",
        "name": "Prestige Base",
        "thumb": "https://www.mousehuntgame.com/images/items/bases/01ae18279319523f4884c155d867c9de.jpg?cv=2",
        "classification": "base",
        "is_item_armed": true,
        "can_arm_item": true
      },
      "weapon": {
        "type": "pirate_sleigh_weapon",
        "name": "S.S. Scoundrel Sleigher Trap",
        "thumb": "https://www.mousehuntgame.com/images/items/weapons/56e4fb25a93d7350014242a3d953a203.jpg?cv=2",
        "classification": "weapon",
        "is_item_armed": true,
        "can_arm_item": true
      },
      "bait": {
        "type": "sky_pirate_cheese",
        "name": "Sky Pirate Swiss Cheese",
        "thumb": "https://www.mousehuntgame.com/images/items/bait/d3d3578292674d2a242f70211c040cfa.gif?cv=2",
        "classification": "bait",
        "is_item_armed": true,
        "can_arm_item": true
      },
      "trinket": {
        "type": "rift_ultimate_luck_trinket",
        "name": "Rift Ultimate Luck Charm",
        "thumb": "https://www.mousehuntgame.com/images/items/trinkets/84c7bfd90f3578fa74487f4575c3f50d.gif?cv=2",
        "classification": "trinket",
        "is_item_armed": true,
        "can_arm_item": true
      }
    }
  },
  "can_retreat": true,
  "power_type_name": "Hydro",
  "island_paper_doll": {
    "is_high_tier": false,
    "type": "hydro_island",
    "mods": [
      {
        "type": "frost_shrine",
        "level": 1
      },
      {
        "type": "sky_pirates",
        "level": 2
      },
      {
        "type": "gem_bonus",
        "level": 1
      }
    ]
  },
  "sky_wardens_total": 4,
  "sky_cheese_recipe": {
    "result_type": "sky_cheese",
    "action_type": "shop",
    "shop_environment": "floating_islands",
    "upsell_item_type": "magic_essence_craft_item",
    "vanilla_items": [
      {
        "type": "cloud_curd_crafting_item",
        "name": "Cloud Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/044b2af27e74a06750e68c489c9165df.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": "1",
        "is_duplicate_item": null
      },
      {
        "type": "gold_stat_item",
        "name": "Gold",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/d8f90a569d52e7ea228ad0f1cc51516d.gif?cv=2",
        "required_quantity": 1000,
        "required_quantity_formatted": "1,000",
        "is_duplicate_item": null
      }
    ],
    "vanilla_action": {
      "label": "Craft Cloud Cheesecake for best results.",
      "css_class": "vanilla",
      "result_quantity": 1,
      "name": "Cloud Cheesecake",
      "subject_type": "sky_cheese",
      "boolean_string_value": false
    },
    "upsell_items": [
      {
        "type": "cloud_curd_crafting_item",
        "name": "Cloud Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/044b2af27e74a06750e68c489c9165df.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": "1",
        "is_duplicate_item": null
      },
      {
        "type": "magic_essence_craft_item",
        "name": "Magic Essence",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/f8f0bb0476b1a7d481407fa797525622.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": "1",
        "is_duplicate_item": null
      }
    ],
    "upsell_action": {
      "label": "Craft with Magic Essence for an increased yield!",
      "css_class": "upsell",
      "result_quantity": 2,
      "name": "Cloud Cheesecake",
      "subject_type": "sky_cheese_pack_small_convertible",
      "boolean_string_value": true
    },
    "show_full_recipes": true,
    "show_recipes_in_groups": true
  },
  "pirate_cheese_recipe": {
    "result_type": "sky_pirate_cheese",
    "action_type": "shop",
    "shop_environment": "floating_islands",
    "upsell_item_type": "magic_essence_craft_item",
    "vanilla_items": [
      {
        "type": "sky_pirate_cheese_curd_crafting_item",
        "name": "Corsair's Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/c07822d0195ffbd72dfed12b647ea6b9.gif?cv=2",
        "required_quantity": 20,
        "required_quantity_formatted": "20",
        "is_duplicate_item": null
      },
      {
        "type": "gold_stat_item",
        "name": "Gold",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/d8f90a569d52e7ea228ad0f1cc51516d.gif?cv=2",
        "required_quantity": 2000,
        "required_quantity_formatted": "2,000",
        "is_duplicate_item": null
      }
    ],
    "vanilla_action": {
      "label": "Craft Sky Pirate Swiss Cheese to catch those corsairs.",
      "css_class": "vanilla",
      "result_quantity": 1,
      "name": "Sky Pirate Swiss",
      "subject_type": "sky_pirate_cheese",
      "boolean_string_value": false
    },
    "upsell_items": [
      {
        "type": "sky_pirate_cheese_curd_crafting_item",
        "name": "Corsair's Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/c07822d0195ffbd72dfed12b647ea6b9.gif?cv=2",
        "required_quantity": 20,
        "required_quantity_formatted": "20",
        "is_duplicate_item": null
      },
      {
        "type": "magic_essence_craft_item",
        "name": "Magic Essence",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/f8f0bb0476b1a7d481407fa797525622.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": "1",
        "is_duplicate_item": null
      }
    ],
    "upsell_action": {
      "label": "Craft with Magic Essence for an increased yield!",
      "css_class": "upsell",
      "result_quantity": 2,
      "name": "Sky Pirate Swiss",
      "subject_type": "pirate_cheese_pack_small_convertible",
      "boolean_string_value": true
    },
    "show_full_recipes": true,
    "show_recipes_in_groups": true
  },
  "items": {
    "sky_cheese": {
      "quantity": "1,106",
      "status": "",
      "can_purchase": true
    },
    "sky_pirate_cheese": {
      "quantity": "38",
      "status": "active",
      "can_purchase": true
    },
    "floating_islands_sky_ore_stat_item": {
      "quantity": "9,859",
      "status": ""
    },
    "floating_islands_cloud_gem_stat_item": {
      "quantity": "9,801",
      "status": ""
    },
    "cloud_curd_crafting_item": {
      "quantity": "2,104",
      "status": ""
    },
    "sky_pirate_cheese_curd_crafting_item": {
      "quantity": "773",
      "status": ""
    },
    "skysoft_silk_stat_item": {
      "quantity": "9",
      "status": ""
    },
    "sky_sprocket_stat_item": {
      "quantity": "12",
      "status": ""
    },
    "enchanted_wing_stat_item": {
      "quantity": "11",
      "status": ""
    },
    "cloudstone_bangle_stat_item": {
      "quantity": "13",
      "status": ""
    },
    "bottled_wind_stat_item": {
      "quantity": "168",
      "status": ""
    },
    "sky_scrambler_stat_item": {
      "quantity": "280",
      "status": ""
    },
    "gold_stat_item": {
      "quantity": "50,437,231",
      "status": ""
    },
    "magic_essence_craft_item": {
      "quantity": "478",
      "status": ""
    }
  },
  "has_flight_log": null,
  "has_power_type_warning": null,
  "has_sky_cheese_warning": null,
  "has_sky_pirate_cheese_warning": null,
  "on_island": true,
  "enemy_state": "enemyDefeated",
  "island_reward_state": "rewardClaimed",
  "hunts_remaining_css_class": "default",
  "hunts_remaining": 31,
  "hunts": "hunts",
  "has_treasure_trove": true
};

const environment_atts_encountering = {
  "hunting_site_atts": {
    "num_hunts_per_mod": 10,
    "island_mod_panels": [
      {
        "type": "wind_shrine",
        "name": "Shrine of Wind",
        "description": "A shrine dedicated to the Warden of Wind!",
        "level": 1,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "+",
        "is_complete": true,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": null,
        "rewards": [],
        "has_rewards": null,
        "special_effect_description": {
          "short": "+1 Speed",
          "full": "Progress through the island faster."
        },
        "has_special_effect_description": true,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null,
        "canvas_page_url": "https://www.mousehuntgame.com/"
      },
      {
        "type": "empty_sky",
        "name": "Empty Terrain",
        "description": "No bonuses here.",
        "level": 1,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "+",
        "is_complete": true,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": null,
        "rewards": [],
        "has_rewards": null,
        "special_effect_description": null,
        "has_special_effect_description": null,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null,
        "canvas_page_url": "https://www.mousehuntgame.com/"
      },
      {
        "type": "empty_sky",
        "name": "Empty Terrain",
        "description": "No bonuses here.",
        "level": 2,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "x",
        "is_complete": true,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": null,
        "rewards": [],
        "has_rewards": null,
        "special_effect_description": null,
        "has_special_effect_description": null,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null,
        "canvas_page_url": "https://www.mousehuntgame.com/"
      },
      {
        "type": "loot_cache",
        "name": "Loot Cache",
        "description": "Drops of Sky Ore, Sky Glass, Cloud Curd, and Corsair Curd are all doubled!",
        "level": 1,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": true
          },
          {
            "owner": "enemy",
            "has_changed": null,
            "is_current": true
          },
          {
            "owner": "enemy",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "enemy",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "enemy",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "enemy",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "enemy",
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "+",
        "is_complete": null,
        "is_failed": null,
        "is_active": true,
        "is_enemy_active": true,
        "rewards": [],
        "has_rewards": null,
        "special_effect_description": {
          "short": "Loot x2",
          "full": "BOOSTS Island Loot!"
        },
        "has_special_effect_description": true,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null,
        "canvas_page_url": "https://www.mousehuntgame.com/"
      }
    ],
    "island_loot": [
      {
        "type": "floating_islands_cloud_gem_stat_item",
        "name": "Sky Glass",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/275d274836db81086a24e89f29de4cbf.gif?cv=2",
        "quantity": 3
      },
      {
        "type": "floating_islands_sky_ore_stat_item",
        "name": "Sky Ore",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/246e7d6fc6f428b15effaf0b4200b838.gif?cv=2",
        "quantity": 3
      }
    ],
    "is_fuel_enabled": true,
    "is_island_fully_explored": null,
    "warden_stones": {
      "fog_shrine": true,
      "frost_shrine": true,
      "rain_shrine": true,
      "wind_shrine": null
    },
    "island_type": "tactical_island",
    "island_power_type": "tctcl",
    "island_name": "Tactical Island",
    "island_name_indefinite_article": "a",
    "island_mod_types": [
      "wind_shrine",
      "empty_sky",
      "empty_sky",
      "loot_cache"
    ],
    "activated_island_mod_types": [
      "wind_shrine",
      "empty_sky",
      "empty_sky",
      "loot_cache"
    ],
    "island_progress": 34,
    "enemy_progress": 6,
    "hunts_remaining": 52,
    "sky_wardens_caught": 3,
    "is_high_tier_island": null,
    "is_high_altitude": null,
    "has_enemy": true,
    "enemy": {
      "id": 1069,
      "type": "wind_warden",
      "name": "Warden of Wind",
      "abbreviated_name": "Warden of Wind",
      "thumb": "https://www.mousehuntgame.com/images/mice/thumb/44e6507370b3548fa01e919caff84945.gif?cv=2"
    },
    "is_enemy_encounter": true,
    "has_encountered_enemy": true,
    "has_defeated_enemy": null,
    "enemy_encounter_hunts_remaining": 0,
    "one_time_reward": [
      {
        "type": "light_floating_loot_cache_convertible",
        "name": "Low Altitude Treasure Trove",
        "thumb": "https://www.mousehuntgame.com/images/items/convertibles/671b9528a32b0190c2579ec18830f594.gif?cv=2"
      },
      {
        "type": "sky_conqueror_egg_convertible",
        "name": "Sky Conqueror Egg",
        "thumb": "https://www.mousehuntgame.com/images/items/convertibles/91ca841f03e1710428ebe7c70f019102.gif?cv=2"
      }
    ],
    "has_treasure_trove": null
  },
  "airship": {
    "user_id": 4753055,
    "oculus_level": 4,
    "sail": {
      "type": null,
      "image": null
    },
    "hull": {
      "type": null,
      "image": null
    },
    "balloon": {
      "type": "airship_balloon_birthday_stat_item",
      "image": "https://www.mousehuntgame.com/images/ui/hud/floating_islands/airship/balloon/airship_balloon_birthday_stat_item.png"
    },
    "can_upgrade_oculus": null
  },
  "saved_trap_setup": {
    "can_arm_setup": true,
    "has_setup": true,
    "is_active": null,
    "items": {
      "base": {
        "type": "valour_rift_prestige_base",
        "name": "Prestige Base",
        "thumb": "https://www.mousehuntgame.com/images/items/bases/01ae18279319523f4884c155d867c9de.jpg?cv=2",
        "classification": "base",
        "is_item_armed": true,
        "can_arm_item": true
      },
      "weapon": {
        "type": "sphynx_weapon",
        "name": "Sphynx Wrath",
        "thumb": "https://www.mousehuntgame.com/images/items/weapons/77828c3fe49646f91c82098979279640.jpg?cv=2",
        "classification": "weapon",
        "is_item_armed": null,
        "can_arm_item": true
      },
      "bait": {
        "type": "sky_cheese",
        "name": "Cloud Cheesecake",
        "thumb": "https://www.mousehuntgame.com/images/items/bait/935f840dbea4d7be71323b9a148cca62.gif?cv=2",
        "classification": "bait",
        "is_item_armed": null,
        "can_arm_item": true
      },
      "trinket": {
        "type": "ultimate_ancient_trinket",
        "name": "Ultimate Ancient Charm",
        "thumb": "https://www.mousehuntgame.com/images/items/trinkets/9a8b7f0ecfd9b8b1f5296ffb41c1dfd1.gif?cv=2",
        "classification": "trinket",
        "is_item_armed": null,
        "can_arm_item": true
      }
    }
  },
  "can_retreat": true,
  "power_type_name": "Tactical",
  "island_paper_doll": {
    "is_high_tier": false,
    "type": "tactical_island",
    "mods": [
      {
        "type": "wind_shrine",
        "level": 1
      },
      {
        "type": "empty_sky",
        "level": 2
      },
      {
        "type": "loot_cache",
        "level": 1
      }
    ],
    "canvas_page_url": "https://www.mousehuntgame.com/"
  },
  "sky_wardens_total": 4,
  "sky_cheese_recipe": {
    "result_type": "sky_cheese",
    "action_type": "shop",
    "shop_environment": "floating_islands",
    "upsell_item_type": "magic_essence_craft_item",
    "vanilla_items": [
      {
        "type": "cloud_curd_crafting_item",
        "name": "Cloud Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/044b2af27e74a06750e68c489c9165df.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": 1,
        "is_duplicate_item": null
      },
      {
        "type": "gold_stat_item",
        "name": "Gold",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/d8f90a569d52e7ea228ad0f1cc51516d.gif?cv=2",
        "required_quantity": 1000,
        "required_quantity_formatted": "1,000",
        "is_duplicate_item": null
      }
    ],
    "vanilla_action": {
      "label": "Craft Cloud Cheesecake for best results.",
      "css_class": "vanilla",
      "result_quantity": 1,
      "name": "Cloud Cheesecake",
      "subject_type": "sky_cheese",
      "boolean_string_value": false
    },
    "upsell_items": [
      {
        "type": "cloud_curd_crafting_item",
        "name": "Cloud Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/044b2af27e74a06750e68c489c9165df.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": 1,
        "is_duplicate_item": null
      },
      {
        "type": "magic_essence_craft_item",
        "name": "Magic Essence",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/f8f0bb0476b1a7d481407fa797525622.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": 1,
        "is_duplicate_item": null
      }
    ],
    "upsell_action": {
      "label": "Craft with Magic Essence for an increased yield!",
      "css_class": "upsell",
      "result_quantity": 2,
      "name": "Cloud Cheesecake",
      "subject_type": "sky_cheese_pack_small_convertible",
      "boolean_string_value": true
    },
    "show_full_recipes": true,
    "show_recipes_in_groups": true
  },
  "pirate_cheese_recipe": {
    "result_type": "sky_pirate_cheese",
    "action_type": "shop",
    "shop_environment": "floating_islands",
    "upsell_item_type": "magic_essence_craft_item",
    "vanilla_items": [
      {
        "type": "sky_pirate_cheese_curd_crafting_item",
        "name": "Corsair's Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/c07822d0195ffbd72dfed12b647ea6b9.gif?cv=2",
        "required_quantity": 20,
        "required_quantity_formatted": 20,
        "is_duplicate_item": null
      },
      {
        "type": "gold_stat_item",
        "name": "Gold",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/d8f90a569d52e7ea228ad0f1cc51516d.gif?cv=2",
        "required_quantity": 2000,
        "required_quantity_formatted": "2,000",
        "is_duplicate_item": null
      }
    ],
    "vanilla_action": {
      "label": "Craft Sky Pirate Swiss Cheese to catch those corsairs.",
      "css_class": "vanilla",
      "result_quantity": 1,
      "name": "Sky Pirate Swiss",
      "subject_type": "sky_pirate_cheese",
      "boolean_string_value": false
    },
    "upsell_items": [
      {
        "type": "sky_pirate_cheese_curd_crafting_item",
        "name": "Corsair's Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/c07822d0195ffbd72dfed12b647ea6b9.gif?cv=2",
        "required_quantity": 20,
        "required_quantity_formatted": 20,
        "is_duplicate_item": null
      },
      {
        "type": "magic_essence_craft_item",
        "name": "Magic Essence",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/f8f0bb0476b1a7d481407fa797525622.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": 1,
        "is_duplicate_item": null
      }
    ],
    "upsell_action": {
      "label": "Craft with Magic Essence for an increased yield!",
      "css_class": "upsell",
      "result_quantity": 2,
      "name": "Sky Pirate Swiss",
      "subject_type": "pirate_cheese_pack_small_convertible",
      "boolean_string_value": true
    },
    "show_full_recipes": true,
    "show_recipes_in_groups": true
  },
  "items": {
    "sky_cheese": {
      "quantity": 74,
      "status": "",
      "can_purchase": true
    },
    "sky_pirate_cheese": {
      "quantity": 0,
      "status": "disabled",
      "can_purchase": true
    },
    "floating_islands_sky_ore_stat_item": {
      "quantity": 181,
      "status": ""
    },
    "floating_islands_cloud_gem_stat_item": {
      "quantity": 17,
      "status": ""
    },
    "cloud_curd_crafting_item": {
      "quantity": 444,
      "status": ""
    },
    "sky_pirate_cheese_curd_crafting_item": {
      "quantity": 100,
      "status": ""
    },
    "skysoft_silk_stat_item": {
      "quantity": 0,
      "status": "disabled"
    },
    "sky_sprocket_stat_item": {
      "quantity": 1,
      "status": ""
    },
    "enchanted_wing_stat_item": {
      "quantity": 1,
      "status": ""
    },
    "cloudstone_bangle_stat_item": {
      "quantity": 0,
      "status": "disabled"
    },
    "bottled_wind_stat_item": {
      "quantity": 100,
      "status": "active"
    },
    "sky_scrambler_stat_item": {
      "quantity": 81,
      "status": ""
    },
    "gold_stat_item": {
      "quantity": "112,938,175",
      "status": ""
    },
    "magic_essence_craft_item": {
      "quantity": 49,
      "status": ""
    }
  },
  "has_flight_log": null,
  "has_power_type_warning": true,
  "has_sky_cheese_warning": true,
  "has_sky_pirate_cheese_warning": null,
  "on_island": true,
  "enemy_state": "enemyActive",
  "island_reward_state": "rewardUnclaimed",
  "hunts_remaining_css_class": "default",
  "hunts_remaining": 52,
  "hunts": "hunts",
  "has_treasure_trove": false,
  "canvas_page_url": "https://www.mousehuntgame.com/"
};

const env_defeated = {
  "hunting_site_atts": {
    "num_hunts_per_mod": 10,
    "island_mod_panels": [
      {
        "type": "wind_shrine",
        "name": "Shrine of Wind",
        "description": "A shrine dedicated to the Warden of Wind!",
        "level": 1,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "+",
        "is_complete": true,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": null,
        "rewards": [],
        "has_rewards": null,
        "special_effect_description": {
          "short": "+1 Speed",
          "full": "Progress through the island faster."
        },
        "has_special_effect_description": true,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null
      },
      {
        "type": "empty_sky",
        "name": "Empty Terrain",
        "description": "No bonuses here.",
        "level": 1,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "+",
        "is_complete": true,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": null,
        "rewards": [],
        "has_rewards": null,
        "special_effect_description": null,
        "has_special_effect_description": null,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null
      },
      {
        "type": "empty_sky",
        "name": "Empty Terrain",
        "description": "No bonuses here.",
        "level": 2,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "x",
        "is_complete": true,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": null,
        "rewards": [],
        "has_rewards": null,
        "special_effect_description": null,
        "has_special_effect_description": null,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null
      },
      {
        "type": "loot_cache",
        "name": "Loot Cache",
        "description": "Drops of Sky Ore, Sky Glass, Cloud Curd, and Corsair Curd are all doubled!",
        "level": 1,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": true,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": true,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": true,
            "is_current": true
          },
          {
            "owner": "enemy",
            "has_changed": null,
            "is_current": true
          },
          {
            "owner": "enemy",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "enemy",
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "+",
        "is_complete": null,
        "is_failed": null,
        "is_active": true,
        "is_enemy_active": true,
        "rewards": [],
        "has_rewards": null,
        "special_effect_description": {
          "short": "Loot x2",
          "full": "BOOSTS Island Loot!"
        },
        "has_special_effect_description": true,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null
      }
    ],
    "island_loot": [
      {
        "type": "floating_islands_cloud_gem_stat_item",
        "name": "Sky Glass",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/275d274836db81086a24e89f29de4cbf.gif?cv=2",
        "quantity": 3
      },
      {
        "type": "floating_islands_sky_ore_stat_item",
        "name": "Sky Ore",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/246e7d6fc6f428b15effaf0b4200b838.gif?cv=2",
        "quantity": 3
      }
    ],
    "is_fuel_enabled": true,
    "is_island_fully_explored": null,
    "warden_stones": {
      "fog_shrine": true,
      "frost_shrine": true,
      "rain_shrine": true,
      "wind_shrine": true
    },
    "island_type": "tactical_island",
    "island_power_type": "tctcl",
    "island_name": "Tactical Island",
    "island_name_indefinite_article": "a",
    "island_mod_types": [
      "wind_shrine",
      "empty_sky",
      "empty_sky",
      "loot_cache"
    ],
    "activated_island_mod_types": [
      "wind_shrine",
      "empty_sky",
      "empty_sky",
      "loot_cache"
    ],
    "island_progress": 37,
    "enemy_progress": 3,
    "hunts_remaining": 51,
    "sky_wardens_caught": 4,
    "is_high_tier_island": null,
    "is_high_altitude": true,
    "has_enemy": true,
    "enemy": {
      "id": 1069,
      "type": "wind_warden",
      "name": "Warden of Wind",
      "abbreviated_name": "Warden of Wind",
      "thumb": "https://www.mousehuntgame.com/images/mice/thumb/44e6507370b3548fa01e919caff84945.gif?cv=2"
    },
    "is_enemy_encounter": false,
    "has_encountered_enemy": true,
    "has_defeated_enemy": true,
    "enemy_encounter_hunts_remaining": 0,
    "one_time_reward": [
      {
        "type": "light_floating_loot_cache_convertible",
        "name": "Low Altitude Treasure Trove",
        "thumb": "https://www.mousehuntgame.com/images/items/convertibles/671b9528a32b0190c2579ec18830f594.gif?cv=2"
      },
      {
        "type": "sky_conqueror_egg_convertible",
        "name": "Sky Conqueror Egg",
        "thumb": "https://www.mousehuntgame.com/images/items/convertibles/91ca841f03e1710428ebe7c70f019102.gif?cv=2"
      }
    ],
    "has_treasure_trove": null
  },
  "airship": {
    "user_id": "4753055",
    "oculus_level": 4,
    "sail": {
      "type": null,
      "image": null
    },
    "hull": {
      "type": null,
      "image": null
    },
    "balloon": {
      "type": "airship_balloon_birthday_stat_item",
      "image": "https://www.mousehuntgame.com/images/ui/hud/floating_islands/airship/balloon/airship_balloon_birthday_stat_item.png"
    },
    "can_upgrade_oculus": null
  },
  "saved_trap_setup": {
    "can_arm_setup": true,
    "has_setup": true,
    "is_active": null,
    "items": {
      "base": {
        "type": "valour_rift_prestige_base",
        "name": "Prestige Base",
        "thumb": "https://www.mousehuntgame.com/images/items/bases/01ae18279319523f4884c155d867c9de.jpg?cv=2",
        "classification": "base",
        "is_item_armed": true,
        "can_arm_item": true
      },
      "weapon": {
        "type": "sphynx_weapon",
        "name": "Sphynx Wrath",
        "thumb": "https://www.mousehuntgame.com/images/items/weapons/77828c3fe49646f91c82098979279640.jpg?cv=2",
        "classification": "weapon",
        "is_item_armed": null,
        "can_arm_item": true
      },
      "bait": {
        "type": "sky_cheese",
        "name": "Cloud Cheesecake",
        "thumb": "https://www.mousehuntgame.com/images/items/bait/935f840dbea4d7be71323b9a148cca62.gif?cv=2",
        "classification": "bait",
        "is_item_armed": null,
        "can_arm_item": true
      },
      "trinket": {
        "type": "ultimate_ancient_trinket",
        "name": "Ultimate Ancient Charm",
        "thumb": "https://www.mousehuntgame.com/images/items/trinkets/9a8b7f0ecfd9b8b1f5296ffb41c1dfd1.gif?cv=2",
        "classification": "trinket",
        "is_item_armed": null,
        "can_arm_item": true
      }
    }
  },
  "can_retreat": true,
  "power_type_name": "Tactical",
  "island_paper_doll": {
    "is_high_tier": false,
    "type": "tactical_island",
    "mods": [
      {
        "type": "wind_shrine",
        "level": 1
      },
      {
        "type": "empty_sky",
        "level": 2
      },
      {
        "type": "loot_cache",
        "level": 1
      }
    ]
  },
  "sky_wardens_total": 4,
  "sky_cheese_recipe": {
    "result_type": "sky_cheese",
    "action_type": "shop",
    "shop_environment": "floating_islands",
    "upsell_item_type": "magic_essence_craft_item",
    "vanilla_items": [
      {
        "type": "cloud_curd_crafting_item",
        "name": "Cloud Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/044b2af27e74a06750e68c489c9165df.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": "1",
        "is_duplicate_item": null
      },
      {
        "type": "gold_stat_item",
        "name": "Gold",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/d8f90a569d52e7ea228ad0f1cc51516d.gif?cv=2",
        "required_quantity": 1000,
        "required_quantity_formatted": "1,000",
        "is_duplicate_item": null
      }
    ],
    "vanilla_action": {
      "label": "Craft Cloud Cheesecake for best results.",
      "css_class": "vanilla",
      "result_quantity": 1,
      "name": "Cloud Cheesecake",
      "subject_type": "sky_cheese",
      "boolean_string_value": false
    },
    "upsell_items": [
      {
        "type": "cloud_curd_crafting_item",
        "name": "Cloud Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/044b2af27e74a06750e68c489c9165df.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": "1",
        "is_duplicate_item": null
      },
      {
        "type": "magic_essence_craft_item",
        "name": "Magic Essence",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/f8f0bb0476b1a7d481407fa797525622.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": "1",
        "is_duplicate_item": null
      }
    ],
    "upsell_action": {
      "label": "Craft with Magic Essence for an increased yield!",
      "css_class": "upsell",
      "result_quantity": 2,
      "name": "Cloud Cheesecake",
      "subject_type": "sky_cheese_pack_small_convertible",
      "boolean_string_value": true
    },
    "show_full_recipes": true,
    "show_recipes_in_groups": true
  },
  "pirate_cheese_recipe": {
    "result_type": "sky_pirate_cheese",
    "action_type": "shop",
    "shop_environment": "floating_islands",
    "upsell_item_type": "magic_essence_craft_item",
    "vanilla_items": [
      {
        "type": "sky_pirate_cheese_curd_crafting_item",
        "name": "Corsair's Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/c07822d0195ffbd72dfed12b647ea6b9.gif?cv=2",
        "required_quantity": 20,
        "required_quantity_formatted": "20",
        "is_duplicate_item": null
      },
      {
        "type": "gold_stat_item",
        "name": "Gold",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/d8f90a569d52e7ea228ad0f1cc51516d.gif?cv=2",
        "required_quantity": 2000,
        "required_quantity_formatted": "2,000",
        "is_duplicate_item": null
      }
    ],
    "vanilla_action": {
      "label": "Craft Sky Pirate Swiss Cheese to catch those corsairs.",
      "css_class": "vanilla",
      "result_quantity": 1,
      "name": "Sky Pirate Swiss",
      "subject_type": "sky_pirate_cheese",
      "boolean_string_value": false
    },
    "upsell_items": [
      {
        "type": "sky_pirate_cheese_curd_crafting_item",
        "name": "Corsair's Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/c07822d0195ffbd72dfed12b647ea6b9.gif?cv=2",
        "required_quantity": 20,
        "required_quantity_formatted": "20",
        "is_duplicate_item": null
      },
      {
        "type": "magic_essence_craft_item",
        "name": "Magic Essence",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/f8f0bb0476b1a7d481407fa797525622.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": "1",
        "is_duplicate_item": null
      }
    ],
    "upsell_action": {
      "label": "Craft with Magic Essence for an increased yield!",
      "css_class": "upsell",
      "result_quantity": 2,
      "name": "Sky Pirate Swiss",
      "subject_type": "pirate_cheese_pack_small_convertible",
      "boolean_string_value": true
    },
    "show_full_recipes": true,
    "show_recipes_in_groups": true
  },
  "items": {
    "sky_cheese": {
      "quantity": "74",
      "status": "",
      "can_purchase": true
    },
    "sky_pirate_cheese": {
      "quantity": "0",
      "status": "disabled",
      "can_purchase": true
    },
    "floating_islands_sky_ore_stat_item": {
      "quantity": "181",
      "status": ""
    },
    "floating_islands_cloud_gem_stat_item": {
      "quantity": "17",
      "status": ""
    },
    "cloud_curd_crafting_item": {
      "quantity": "444",
      "status": ""
    },
    "sky_pirate_cheese_curd_crafting_item": {
      "quantity": "100",
      "status": ""
    },
    "skysoft_silk_stat_item": {
      "quantity": "0",
      "status": "disabled"
    },
    "sky_sprocket_stat_item": {
      "quantity": "1",
      "status": ""
    },
    "enchanted_wing_stat_item": {
      "quantity": "1",
      "status": ""
    },
    "cloudstone_bangle_stat_item": {
      "quantity": "0",
      "status": "disabled"
    },
    "bottled_wind_stat_item": {
      "quantity": "99",
      "status": "active"
    },
    "sky_scrambler_stat_item": {
      "quantity": "82",
      "status": ""
    },
    "gold_stat_item": {
      "quantity": "112,968,175",
      "status": ""
    },
    "magic_essence_craft_item": {
      "quantity": "49",
      "status": ""
    }
  },
  "has_flight_log": null,
  "has_power_type_warning": true,
  "has_sky_cheese_warning": true,
  "has_sky_pirate_cheese_warning": null,
  "on_island": true,
  "enemy_state": "enemyDefeated",
  "island_reward_state": "rewardUnclaimed",
  "hunts_remaining_css_class": "default",
  "hunts_remaining": 51,
  "hunts": "hunts",
  "has_treasure_trove": false
};

const env_marching_high = {
  "hunting_site_atts": {
    "num_hunts_per_mod": 10,
    "island_mod_panels": [
      {
        "type": "paragon_cache_c",
        "name": "Paragon Wing Shrine",
        "description": "One of many shrines of loot guarded by a Sky Paragon.",
        "level": 1,
        "pips": [
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "player",
            "has_changed": null,
            "is_current": true
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "+",
        "is_complete": null,
        "is_failed": null,
        "is_active": true,
        "is_enemy_active": null,
        "rewards": [],
        "has_rewards": null,
        "special_effect_description": {
          "short": "+1 Speed",
          "full": "Progress through the island faster."
        },
        "has_special_effect_description": true,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null,
        "canvas_page_url": "https://www.mousehuntgame.com/"
      },
      {
        "type": "ore_bonus",
        "name": "Sky Ore Deposit",
        "description": "Provides a Sky Ore bonus to the mice on this island.",
        "level": 1,
        "pips": [
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "x",
        "is_complete": null,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": null,
        "rewards": [
          {
            "type": "floating_islands_sky_ore_stat_item",
            "name": "Sky Ore",
            "thumb": "https://www.mousehuntgame.com/images/items/stats/246e7d6fc6f428b15effaf0b4200b838.gif?cv=2",
            "quantity": 2,
            "loot_cache_quantity": 2,
            "total_quantity": 4
          }
        ],
        "has_rewards": true,
        "special_effect_description": null,
        "has_special_effect_description": null,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": true,
        "canvas_page_url": "https://www.mousehuntgame.com/"
      },
      {
        "type": "gem_bonus",
        "name": "Sky Glass Formation",
        "description": "Provides a Sky Glass bonus to the mice on this island.",
        "level": 1,
        "pips": [
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          }
        ],
        "sign": "x",
        "is_complete": null,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": null,
        "rewards": [
          {
            "type": "floating_islands_cloud_gem_stat_item",
            "name": "Sky Glass",
            "thumb": "https://www.mousehuntgame.com/images/items/stats/275d274836db81086a24e89f29de4cbf.gif?cv=2",
            "quantity": 2,
            "loot_cache_quantity": 2,
            "total_quantity": 4
          }
        ],
        "has_rewards": true,
        "special_effect_description": null,
        "has_special_effect_description": null,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": true,
        "canvas_page_url": "https://www.mousehuntgame.com/"
      },
      {
        "type": "loot_cache",
        "name": "Loot Cache",
        "description": "Drops of Sky Ore, Sky Glass, Cloud Curd, and Corsair Curd are all doubled!",
        "level": 1,
        "pips": [
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": null,
            "has_changed": null,
            "is_current": false
          },
          {
            "owner": "enemy",
            "has_changed": null,
            "is_current": true
          }
        ],
        "sign": "+",
        "is_complete": null,
        "is_failed": null,
        "is_active": null,
        "is_enemy_active": true,
        "rewards": [],
        "has_rewards": null,
        "special_effect_description": {
          "short": "Loot x2",
          "full": "BOOSTS Island Loot!"
        },
        "has_special_effect_description": true,
        "loot_cache_multiplier": 2,
        "has_loot_cache_multiplier": null,
        "has_high_tier_island_multiplier": null,
        "canvas_page_url": "https://www.mousehuntgame.com/"
      }
    ],
    "island_loot": [
      {
        "type": "floating_islands_cloud_gem_stat_item",
        "name": "Sky Glass",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/275d274836db81086a24e89f29de4cbf.gif?cv=2",
        "quantity": 2
      },
      {
        "type": "floating_islands_sky_ore_stat_item",
        "name": "Sky Ore",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/246e7d6fc6f428b15effaf0b4200b838.gif?cv=2",
        "quantity": 2
      }
    ],
    "is_fuel_enabled": null,
    "is_island_fully_explored": null,
    "warden_stones": {
      "fog_shrine": true,
      "frost_shrine": true,
      "rain_shrine": true,
      "wind_shrine": true
    },
    "island_type": "forgotten_island_high",
    "island_power_type": "frgttn",
    "island_name": "Forgotten Fortress",
    "island_name_indefinite_article": "a",
    "island_mod_types": [
      "paragon_cache_c",
      "ore_bonus",
      "gem_bonus",
      "loot_cache"
    ],
    "activated_island_mod_types": [
      "paragon_cache_c"
    ],
    "island_progress": 6,
    "enemy_progress": 1,
    "hunts_remaining": 71,
    "sky_wardens_caught": 4,
    "is_high_tier_island": true,
    "is_high_altitude": true,
    "has_enemy": true,
    "enemy": {
      "id": 1030,
      "type": "forgotten_paragon",
      "name": "Paragon of Forgotten",
      "abbreviated_name": "Paragon of Forgotten",
      "thumb": "https://www.mousehuntgame.com/images/mice/thumb/30b94e1ce60ef9c4980ccfaa8930455b.gif?cv=2"
    },
    "is_enemy_encounter": false,
    "has_encountered_enemy": null,
    "has_defeated_enemy": null,
    "enemy_encounter_hunts_remaining": 33,
    "one_time_reward": [
      {
        "type": "heavy_floating_loot_cache_convertible",
        "name": "High Altitude Treasure Trove",
        "thumb": "https://www.mousehuntgame.com/images/items/convertibles/6ea16e8ce6b8a731afdc06c7c0c7a28f.gif?cv=2"
      },
      {
        "type": "sky_conqueror_egg_convertible",
        "name": "Sky Conqueror Egg",
        "thumb": "https://www.mousehuntgame.com/images/items/convertibles/91ca841f03e1710428ebe7c70f019102.gif?cv=2"
      }
    ],
    "has_treasure_trove": null
  },
  "airship": {
    "user_id": 4753055,
    "oculus_level": 4,
    "sail": {
      "type": "airship_sail_birthday_stat_item",
      "image": "https://www.mousehuntgame.com/images/ui/hud/floating_islands/airship/sail/airship_sail_birthday_stat_item.png"
    },
    "hull": {
      "type": "airship_hull_birthday_stat_item",
      "image": "https://www.mousehuntgame.com/images/ui/hud/floating_islands/airship/hull/airship_hull_birthday_stat_item.png"
    },
    "balloon": {
      "type": "airship_balloon_birthday_stat_item",
      "image": "https://www.mousehuntgame.com/images/ui/hud/floating_islands/airship/balloon/airship_balloon_birthday_stat_item.png"
    },
    "can_upgrade_oculus": null
  },
  "saved_trap_setup": {
    "can_arm_setup": true,
    "has_setup": true,
    "is_active": null,
    "items": {
      "base": {
        "type": "valour_rift_prestige_base",
        "name": "Prestige Base",
        "thumb": "https://www.mousehuntgame.com/images/items/bases/01ae18279319523f4884c155d867c9de.jpg?cv=2",
        "classification": "base",
        "is_item_armed": true,
        "can_arm_item": true
      },
      "weapon": {
        "type": "infinite_labyrinth_weapon",
        "name": "Infinite Labyrinth Trap",
        "thumb": "https://www.mousehuntgame.com/images/items/weapons/b76df47126116e639758d883eeb06bd0.jpg?cv=2",
        "classification": "weapon",
        "is_item_armed": true,
        "can_arm_item": true
      },
      "bait": {
        "type": "sky_cheese",
        "name": "Cloud Cheesecake",
        "thumb": "https://www.mousehuntgame.com/images/items/bait/935f840dbea4d7be71323b9a148cca62.gif?cv=2",
        "classification": "bait",
        "is_item_armed": true,
        "can_arm_item": true
      },
      "trinket": {
        "type": "ultimate_ancient_trinket",
        "name": "Ultimate Ancient Charm",
        "thumb": "https://www.mousehuntgame.com/images/items/trinkets/9a8b7f0ecfd9b8b1f5296ffb41c1dfd1.gif?cv=2",
        "classification": "trinket",
        "is_item_armed": true,
        "can_arm_item": true
      }
    }
  },
  "can_retreat": null,
  "power_type_name": "Forgotten",
  "island_paper_doll": {
    "is_high_tier": true,
    "type": "forgotten_island_high",
    "mods": [
      {
        "type": "paragon_cache_c",
        "level": 1
      },
      {
        "type": "ore_bonus",
        "level": 1
      },
      {
        "type": "gem_bonus",
        "level": 1
      },
      {
        "type": "loot_cache",
        "level": 1
      }
    ],
    "canvas_page_url": "https://www.mousehuntgame.com/"
  },
  "sky_wardens_total": 4,
  "sky_cheese_recipe": {
    "result_type": "sky_cheese",
    "action_type": "shop",
    "shop_environment": "floating_islands",
    "upsell_item_type": "magic_essence_craft_item",
    "vanilla_items": [
      {
        "type": "cloud_curd_crafting_item",
        "name": "Cloud Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/044b2af27e74a06750e68c489c9165df.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": 1,
        "is_duplicate_item": null
      },
      {
        "type": "gold_stat_item",
        "name": "Gold",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/d8f90a569d52e7ea228ad0f1cc51516d.gif?cv=2",
        "required_quantity": 1000,
        "required_quantity_formatted": "1,000",
        "is_duplicate_item": null
      }
    ],
    "vanilla_action": {
      "label": "Craft Cloud Cheesecake for best results.",
      "css_class": "vanilla",
      "result_quantity": 1,
      "name": "Cloud Cheesecake",
      "subject_type": "sky_cheese",
      "boolean_string_value": false
    },
    "upsell_items": [
      {
        "type": "cloud_curd_crafting_item",
        "name": "Cloud Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/044b2af27e74a06750e68c489c9165df.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": 1,
        "is_duplicate_item": null
      },
      {
        "type": "magic_essence_craft_item",
        "name": "Magic Essence",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/f8f0bb0476b1a7d481407fa797525622.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": 1,
        "is_duplicate_item": null
      }
    ],
    "upsell_action": {
      "label": "Craft with Magic Essence for an increased yield!",
      "css_class": "upsell",
      "result_quantity": 2,
      "name": "Cloud Cheesecake",
      "subject_type": "sky_cheese_pack_small_convertible",
      "boolean_string_value": true
    },
    "show_full_recipes": true,
    "show_recipes_in_groups": true
  },
  "pirate_cheese_recipe": {
    "result_type": "sky_pirate_cheese",
    "action_type": "shop",
    "shop_environment": "floating_islands",
    "upsell_item_type": "magic_essence_craft_item",
    "vanilla_items": [
      {
        "type": "sky_pirate_cheese_curd_crafting_item",
        "name": "Corsair's Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/c07822d0195ffbd72dfed12b647ea6b9.gif?cv=2",
        "required_quantity": 20,
        "required_quantity_formatted": 20,
        "is_duplicate_item": null
      },
      {
        "type": "gold_stat_item",
        "name": "Gold",
        "thumb": "https://www.mousehuntgame.com/images/items/stats/d8f90a569d52e7ea228ad0f1cc51516d.gif?cv=2",
        "required_quantity": 2000,
        "required_quantity_formatted": "2,000",
        "is_duplicate_item": null
      }
    ],
    "vanilla_action": {
      "label": "Craft Sky Pirate Swiss Cheese to catch those corsairs.",
      "css_class": "vanilla",
      "result_quantity": 1,
      "name": "Sky Pirate Swiss",
      "subject_type": "sky_pirate_cheese",
      "boolean_string_value": false
    },
    "upsell_items": [
      {
        "type": "sky_pirate_cheese_curd_crafting_item",
        "name": "Corsair's Curd",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/c07822d0195ffbd72dfed12b647ea6b9.gif?cv=2",
        "required_quantity": 20,
        "required_quantity_formatted": 20,
        "is_duplicate_item": null
      },
      {
        "type": "magic_essence_craft_item",
        "name": "Magic Essence",
        "thumb": "https://www.mousehuntgame.com/images/items/crafting_items/thumbnails/f8f0bb0476b1a7d481407fa797525622.gif?cv=2",
        "required_quantity": 1,
        "required_quantity_formatted": 1,
        "is_duplicate_item": null
      }
    ],
    "upsell_action": {
      "label": "Craft with Magic Essence for an increased yield!",
      "css_class": "upsell",
      "result_quantity": 2,
      "name": "Sky Pirate Swiss",
      "subject_type": "pirate_cheese_pack_small_convertible",
      "boolean_string_value": true
    },
    "show_full_recipes": true,
    "show_recipes_in_groups": true
  },
  "items": {
    "sky_cheese": {
      "quantity": 91,
      "status": "active",
      "can_purchase": true
    },
    "sky_pirate_cheese": {
      "quantity": 0,
      "status": "disabled",
      "can_purchase": true
    },
    "floating_islands_sky_ore_stat_item": {
      "quantity": 934,
      "status": ""
    },
    "floating_islands_cloud_gem_stat_item": {
      "quantity": 696,
      "status": ""
    },
    "cloud_curd_crafting_item": {
      "quantity": 365,
      "status": ""
    },
    "sky_pirate_cheese_curd_crafting_item": {
      "quantity": 100,
      "status": ""
    },
    "skysoft_silk_stat_item": {
      "quantity": 0,
      "status": "disabled"
    },
    "sky_sprocket_stat_item": {
      "quantity": 1,
      "status": ""
    },
    "enchanted_wing_stat_item": {
      "quantity": 9,
      "status": ""
    },
    "cloudstone_bangle_stat_item": {
      "quantity": 0,
      "status": "disabled"
    },
    "bottled_wind_stat_item": {
      "quantity": 104,
      "status": ""
    },
    "sky_scrambler_stat_item": {
      "quantity": 89,
      "status": ""
    },
    "gold_stat_item": {
      "quantity": "116,003,876",
      "status": ""
    },
    "magic_essence_craft_item": {
      "quantity": 49,
      "status": ""
    }
  },
  "has_flight_log": null,
  "has_power_type_warning": null,
  "has_sky_cheese_warning": null,
  "has_sky_pirate_cheese_warning": null,
  "on_island": true,
  "enemy_state": "enemyApproaching",
  "island_reward_state": "rewardUnclaimed",
  "hunts_remaining_css_class": "default",
  "hunts_remaining": 71,
  "hunts": "hunts",
  "has_treasure_trove": false,
  "canvas_page_url": "https://www.mousehuntgame.com/"
};
