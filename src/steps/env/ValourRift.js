import EnvironmentModule from "../environment-module";
import op from "object-path";
import db from "../../data";

export default class ValourRift extends EnvironmentModule {

  initialize(config) {
    this.config = config;
    this.farmingSetup = db.verifySetup(config["farmingSetup"]);
    this.climbingSetup = db.verifySetup(config["climbingSetup"]);
    this.eclipseSetup = db.verifySetup(config["eclipseSetup"]);
    this.eclipseUmbraSetup = db.verifySetup(config["eclipseUmbraSetup"]);
    this.climbingUmbraSetup = db.verifySetup(config["climbingUmbraSetup"]);
    this.toggleFireUponEclipse = config["toggleFireUponEclipse"];
  }

  shouldRun({ user }) {
    return user["environment_type"] === "rift_valour";
  }

  async run(ctx) {
    const { user } = ctx;
    const currentState = op.get(user, "enviroment_atts.state");
    const hasCurrentStateChanged = this.hasValueChanged("currentState", currentState);

    if (currentState === "farming" && hasCurrentStateChanged) {
      // no need to update if we're still farming
      await this.updateForOutside(ctx);
    } else if (currentState === "tower") {
      await this.updateForTower(ctx);
    }
  }

  async updateForOutside(ctx) {
    ctx.logger.log("Exited tower!");
    await this.armSetup(ctx, this.farmingSetup, "farming setup");
    await this.toggleChampionFire(ctx, false);
  }

  async updateForTower(ctx) {
    const { logger, user } = ctx;

    const currentFloor = op.get(user, "enviroment_atts.floor");
    const isUltimateUmbra = op.get(user, "enviroment_atts.is_eclipse_mode");

    // no need to update if we're on the same floor
    if (!this.hasValueChanged("currentFloor", currentFloor)) return;

    logger.log("Current floor: " + currentFloor);

    const isAtEclipse = op.get(user, "enviroment_atts.is_at_eclipse");

    if (this.hasValueChanged("isAtEclipse", isAtEclipse)) {
      if (isAtEclipse) {
        logger.log("Boss level: " + op.get(user, "enviroment_atts.boss_name"));

        if (this.toggleFireUponEclipse) {
          await this.toggleChampionFire(ctx, true);
        }

        if (isUltimateUmbra) {
          await this.armSetup(ctx, this.eclipseUmbraSetup, "Eclipse Umbra setup");
        } else {
          await this.armSetup(ctx, this.eclipseSetup, "Eclipse setup");
        }

      } else {
        if (this.toggleFireUponEclipse) {
          await this.toggleChampionFire(ctx, false);
        }

        if (isUltimateUmbra) {
          await this.armSetup(ctx, this.climbingUmbraSetup, "Climbing Umbra setup");
        } else {
          await this.armSetup(ctx, this.climbingSetup, "Climbing setup");
        }
      }
    }
  }

  //region User Info Getters


  //endregion

  //region Actions

  async toggleChampionFire({ user, logger, page }, shouldBurn) {
    const isFireBurning = op.get(user, "enviroment_atts.is_fuel_enabled");

    if ((isFireBurning && !shouldBurn) || (!isFireBurning && shouldBurn)) {
      logger.log(`${shouldBurn ? "Lighting" : "Extinguishing"} Champion's Fire!`);
      await page.evaluate("hg.views.HeadsUpDisplayRiftValourView.toggleFuel()");
    }
  }

  //endregion
}

const env_farming = {
  "state": "farming",
  "hunts_remaining": 0,
  "current_step": 0,
  "current_step_formatted": "0",
  "prestige": 1,
  "prestige_current_step": 0,
  "prestige_total_step": 141,
  "initial_hunt_remaining": 40,
  "floor": 1,
  "floor_name": "Puppet",
  "floor_type": 1,
  "floor_prestige": 1,
  "floor_prestige_suffix": "st",
  "floor_steps": 20,
  "floor_percent": 0,
  "floor_data": [
    {
      "id": 1,
      "type": 1,
      "prestige": 1,
      "prestige_starting_step": 0,
      "name": "Floor 1",
      "length": 20,
      "start": 0
    },
    {
      "id": 2,
      "type": 2,
      "prestige": 1,
      "prestige_starting_step": 0,
      "name": "Floor 2",
      "length": 20,
      "start": 20
    },
    {
      "id": 3,
      "type": 3,
      "prestige": 1,
      "prestige_starting_step": 0,
      "name": "Floor 3",
      "length": 20,
      "start": 40
    },
    {
      "id": 4,
      "type": 4,
      "prestige": 1,
      "prestige_starting_step": 0,
      "name": "Floor 4",
      "length": 20,
      "start": 60
    }
  ],
  "is_at_eclipse": false,
  "power_up_data": {
    "long_stride": {
      "name": "Speed",
      "type": "long_stride",
      "description": "Upgrade to increase the number of steps you take with each catch.",
      "current_level": 0,
      "current_value": 1,
      "can_upgrade": null,
      "is_complete": null,
      "levels": [
        {
          "cost": [],
          "value": 1,
          "label": 1,
          "is_current": true,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 30,
              "name": "Tower Sigil",
              "percent": 0,
              "formatted_quantity": "30",
              "owned": "0",
              "has_enough": null
            }
          ],
          "value": 2,
          "label": 2,
          "is_visible": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            }
          ],
          "value": 3,
          "label": 3
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            },
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 75
            }
          ],
          "value": 4,
          "label": 4
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 100
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 5,
          "label": 5
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 250
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 15
            }
          ],
          "value": 6,
          "label": 6
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 3
            }
          ],
          "value": 7,
          "label": 7
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 8,
          "label": 8
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 25
            }
          ],
          "value": 9,
          "label": 9
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 50
            }
          ],
          "value": 10,
          "label": 10
        }
      ],
      "increment": 1
    },
    "hunt_limit": {
      "name": "Sync",
      "type": "hunt_limit",
      "description": "Determines how well you stay in sync with the tower, increasing the number of hunts you can take before falling out of phase.",
      "current_level": 0,
      "current_value": 40,
      "can_upgrade": null,
      "is_complete": null,
      "levels": [
        {
          "cost": [],
          "value": 40,
          "label": 1,
          "is_current": true,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 30,
              "name": "Tower Sigil",
              "percent": 0,
              "formatted_quantity": "30",
              "owned": "0",
              "has_enough": null
            }
          ],
          "value": 50,
          "label": 2,
          "is_visible": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            }
          ],
          "value": 60,
          "label": 3
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            },
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 75
            }
          ],
          "value": 70,
          "label": 4
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 100
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 80,
          "label": 5
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 250
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 15
            }
          ],
          "value": 90,
          "label": 6
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 3
            }
          ],
          "value": 100,
          "label": 7
        }
      ],
      "increment": 10
    },
    "boss_extension": {
      "name": "Siphon",
      "type": "boss_extension",
      "description": "Extends the number of hunts remaining every time the Eclipse is caught.",
      "current_level": 0,
      "current_value": 5,
      "can_upgrade": null,
      "is_complete": null,
      "levels": [
        {
          "cost": [],
          "value": 5,
          "label": 1,
          "is_current": true,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100,
              "name": "Tower Sigil",
              "percent": 0,
              "formatted_quantity": "100",
              "owned": "0",
              "has_enough": null
            }
          ],
          "value": 10,
          "label": 2,
          "is_visible": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            },
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 75
            }
          ],
          "value": 15,
          "label": 3
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 100
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 20,
          "label": 4
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 25,
          "label": 5
        }
      ],
      "increment": 5
    }
  },
  "is_eclipse_mode": null,
  "is_fuel_enabled": false,
  "can_retreat": null,
  "can_claim": false,
  "has_hunt_warning": null,
  "tracked_loot": [],
  "highest_floor_reached": 0,
  "ultimatum_highest_floor_reached": null,
  "augmentation_data": {
    "hr": {
      "name": "Sigil Hunter",
      "description": "Adds 50% more Tower Sigils to cache.",
      "unlock_floor": 5,
      "unlock_message": "",
      "cost": [
        {
          "type": "gold_stat_item",
          "quantity": 250000
        }
      ],
      "is_locked": true
    },
    "sr": {
      "name": "Secret Research",
      "description": "Adds 50% more Tower Secrets to cache",
      "unlock_floor": 15,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_a_stat_item",
          "quantity": 500
        }
      ],
      "is_locked": true
    },
    "ss": {
      "name": "Super Siphon",
      "description": "Doubles the effect of Siphon",
      "unlock_floor": 20,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_a_stat_item",
          "quantity": 1000
        }
      ],
      "is_locked": true
    },
    "tu": {
      "name": "Ultimate Umbra",
      "description": "Confront a tougher challenge and earn more rewards. Failing to catch pushes you back!",
      "unlock_floor": 25,
      "unlock_message": "",
      "cost": [
        {
          "type": "shade_eclipse_resource_stat_item",
          "quantity": 75
        }
      ],
      "is_locked": true
    },
    "er": {
      "name": "Elixir Rain",
      "description": "Mice have a 50% chance of dropping an Elixir.",
      "unlock_floor": 40,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_b_stat_item",
          "quantity": 500
        }
      ],
      "is_locked": true
    },
    "sste": {
      "name": "String Stepping",
      "description": "Capturing the Terrified Adventurer gives x2 progress.",
      "unlock_floor": 65,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_b_stat_item",
          "quantity": 1500
        }
      ],
      "is_locked": true
    }
  },
  "phase": "farming",
  "items": {
    "marble_string_cheese": {
      "quantity": "0",
      "status": "disabled hidden"
    },
    "swiss_string_cheese": {
      "quantity": "26",
      "status": "hidden"
    },
    "brie_string_cheese": {
      "quantity": "0",
      "status": "disabled hidden"
    },
    "magical_string_cheese": {
      "quantity": "35",
      "status": ""
    },
    "gauntlet_string_cheese": {
      "quantity": "4",
      "status": "",
      "can_purchase": true
    },
    "rift_gaunt_upgrade_a_stat_item": {
      "quantity": "0",
      "status": "disabled"
    },
    "rift_gaunt_upgrade_b_stat_item": {
      "quantity": "0",
      "status": "disabled"
    },
    "gauntlet_elixir_stat_item": {
      "quantity": "190",
      "status": ""
    },
    "rift_gauntlet_fuel_stat_item": {
      "quantity": "4",
      "status": ""
    },
    "magic_essence_craft_item": {
      "quantity": "47",
      "status": ""
    },
    "gold_stat_item": {
      "quantity": "25,109,857",
      "status": ""
    },
    "shade_eclipse_resource_stat_item": {
      "quantity": "0",
      "status": "disabled"
    },
    "total_eclipse_resource_stat_item": {
      "quantity": "0",
      "status": "disabled"
    }
  },
  "retreat_consolation": [],
  "floor_numerals": [
    "0",
    "0",
    "0"
  ],
  "has_bait_warning": null,
  "has_power_type_warning": null,
  "prestige_remaining_steps": 141,
  "boss_name": "Shade of the Eclipse Mouse"
};
const env_normal_boss_level = {
  "state": "tower",
  "hunts_remaining": 85,
  "current_step": 140,
  "current_step_formatted": 140,
  "prestige": 1,
  "prestige_current_step": 140,
  "prestige_total_step": 141,
  "initial_hunt_remaining": 100,
  "floor": 8,
  "floor_name": "Boss",
  "floor_type": 8,
  "floor_prestige": 8,
  "floor_prestige_suffix": "st",
  "floor_steps": 20,
  "floor_percent": 0,
  "floor_data": [
    {
      "id": 7,
      "type": 7,
      "prestige": 1,
      "prestige_starting_step": 0,
      "name": "Floor 7",
      "length": 20,
      "start": 120
    },
    {
      "id": 8,
      "type": 8,
      "prestige": 1,
      "prestige_starting_step": 0,
      "name": "Floor 8",
      "length": 1,
      "start": 140
    },
    {
      "id": 9,
      "type": 1,
      "prestige": 2,
      "prestige_starting_step": 141,
      "name": "Floor 9",
      "length": 30,
      "start": 141
    },
    {
      "id": 10,
      "type": 2,
      "prestige": 2,
      "prestige_starting_step": 141,
      "name": "Floor 10",
      "length": 30,
      "start": 171
    },
    {
      "id": 11,
      "type": 3,
      "prestige": 2,
      "prestige_starting_step": 141,
      "name": "Floor 11",
      "length": 30,
      "start": 201
    }
  ],
  "is_at_eclipse": true,
  "power_up_data": {
    "long_stride": {
      "name": "Speed",
      "type": "long_stride",
      "description": "Upgrade to increase the number of steps you take with each catch.",
      "current_level": 9,
      "current_value": 10,
      "can_upgrade": null,
      "is_complete": true,
      "levels": [
        {
          "cost": [],
          "value": 1,
          "label": 1,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 30
            }
          ],
          "value": 2,
          "label": 2,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            }
          ],
          "value": 3,
          "label": 3,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            },
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 75
            }
          ],
          "value": 4,
          "label": 4,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 100
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 5,
          "label": 5,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 250
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 15
            }
          ],
          "value": 6,
          "label": 6,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 3
            }
          ],
          "value": 7,
          "label": 7,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 8,
          "label": 8,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 25
            }
          ],
          "value": 9,
          "label": 9,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500,
              "name": "Tower Secrets",
              "percent": 100,
              "formatted_quantity": 500,
              "owned": 500,
              "has_enough": true
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 50,
              "name": "Core of the Eclipse",
              "percent": 100,
              "formatted_quantity": 50,
              "owned": 50,
              "has_enough": true
            }
          ],
          "value": 10,
          "label": 10,
          "is_current": true,
          "is_active": true,
          "is_visible": true
        }
      ],
      "increment": 1
    },
    "hunt_limit": {
      "name": "Sync",
      "type": "hunt_limit",
      "description": "Determines how well you stay in sync with the tower, increasing the number of hunts you can take before falling out of phase.",
      "current_level": 6,
      "current_value": 100,
      "can_upgrade": null,
      "is_complete": true,
      "levels": [
        {
          "cost": [],
          "value": 40,
          "label": 1,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 30
            }
          ],
          "value": 50,
          "label": 2,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            }
          ],
          "value": 60,
          "label": 3,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            },
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 75
            }
          ],
          "value": 70,
          "label": 4,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 100
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 80,
          "label": 5,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 250
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 15
            }
          ],
          "value": 90,
          "label": 6,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500,
              "name": "Tower Secrets",
              "percent": 100,
              "formatted_quantity": 500,
              "owned": 500,
              "has_enough": true
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 3,
              "name": "Core of the Eclipse",
              "percent": 100,
              "formatted_quantity": 3,
              "owned": 3,
              "has_enough": true
            }
          ],
          "value": 100,
          "label": 7,
          "is_current": true,
          "is_active": true,
          "is_visible": true
        }
      ],
      "increment": 10
    },
    "boss_extension": {
      "name": "Siphon",
      "type": "boss_extension",
      "description": "Extends the number of hunts remaining every time the Eclipse is caught.",
      "current_level": 4,
      "current_value": 25,
      "can_upgrade": null,
      "is_complete": true,
      "levels": [
        {
          "cost": [],
          "value": 5,
          "label": 1,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            }
          ],
          "value": 10,
          "label": 2,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            },
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 75
            }
          ],
          "value": 15,
          "label": 3,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 100
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 20,
          "label": 4,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500,
              "name": "Tower Secrets",
              "percent": 100,
              "formatted_quantity": 500,
              "owned": 500,
              "has_enough": true
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 10,
              "name": "Core of the Eclipse",
              "percent": 100,
              "formatted_quantity": 10,
              "owned": 10,
              "has_enough": true
            }
          ],
          "value": 25,
          "label": 5,
          "is_current": true,
          "is_active": true,
          "is_visible": true
        }
      ],
      "increment": 5
    }
  },
  "is_eclipse_mode": null,
  "is_fuel_enabled": true,
  "can_retreat": true,
  "can_claim": false,
  "has_hunt_warning": null,
  "tracked_loot": {
    "431": {
      "m": 30430
    },
    "2898": {
      "m": 6,
      "f": 1
    },
    "2900": {
      "m": 1
    }
  },
  "highest_floor_reached": 65,
  "ultimatum_highest_floor_reached": 76,
  "augmentation_data": {
    "hr": {
      "name": "Sigil Hunter",
      "description": "Adds 50% more Tower Sigils to cache.",
      "unlock_floor": 5,
      "unlock_message": "",
      "cost": [
        {
          "type": "gold_stat_item",
          "quantity": 250000
        }
      ],
      "is_locked": null
    },
    "sr": {
      "name": "Secret Research",
      "description": "Adds 50% more Tower Secrets to cache",
      "unlock_floor": 15,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_a_stat_item",
          "quantity": 500
        }
      ],
      "is_locked": null
    },
    "ss": {
      "name": "Super Siphon",
      "description": "Doubles the effect of Siphon",
      "unlock_floor": 20,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_a_stat_item",
          "quantity": 1000
        }
      ],
      "is_locked": null
    },
    "tu": {
      "name": "Ultimate Umbra",
      "description": "Confront a tougher challenge and earn more rewards. Failing to catch pushes you back!",
      "unlock_floor": 25,
      "unlock_message": "",
      "cost": [
        {
          "type": "shade_eclipse_resource_stat_item",
          "quantity": 75
        }
      ],
      "is_locked": null
    },
    "er": {
      "name": "Elixir Rain",
      "description": "Mice have a 50% chance of dropping an Elixir.",
      "unlock_floor": 40,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_b_stat_item",
          "quantity": 500
        }
      ],
      "is_locked": null
    },
    "sste": {
      "name": "String Stepping",
      "description": "Capturing the Terrified Adventurer gives x2 progress.",
      "unlock_floor": 65,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_b_stat_item",
          "quantity": 1500
        }
      ],
      "is_locked": null
    }
  },
  "sprite_layers": [
    {
      "type": "floors",
      "sprites": [
        {
          "id": "floor_7",
          "name": "Floor 7",
          "frames": [
            {
              "left": 0,
              "top": 135,
              "width": 380,
              "height": 150,
              "add_css_class": "floor floor_7 previous_floor",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "floor_8",
          "name": "Floor 8",
          "frames": [
            {
              "left": 0,
              "top": -23,
              "width": 380,
              "height": 158,
              "add_css_class": "floor floor_8 active_floor",
              "remove_css_class": ""
            }
          ]
        }
      ]
    },
    {
      "type": "step",
      "sprites": [
        {
          "id": "step_140",
          "name": null,
          "frames": [
            {
              "left": 18,
              "top": 128,
              "width": 30,
              "height": 8,
              "add_css_class": "step current ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_139",
          "name": null,
          "frames": [
            {
              "left": 49,
              "top": 135,
              "width": 30,
              "height": 8,
              "add_css_class": "step active ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_138",
          "name": null,
          "frames": [
            {
              "left": 80,
              "top": 143,
              "width": 30,
              "height": 8,
              "add_css_class": "step active ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_137",
          "name": null,
          "frames": [
            {
              "left": 112,
              "top": 150,
              "width": 30,
              "height": 8,
              "add_css_class": "step active ",
              "remove_css_class": ""
            }
          ]
        }
      ]
    },
    {
      "type": "scores",
      "sprites": []
    },
    {
      "type": "friends",
      "sprites": []
    },
    {
      "type": "player",
      "sprites": [
        {
          "id": "player",
          "name": "Kent Nguyen<span>Step 140</span>",
          "frames": [
            {
              "left": 342,
              "top": 203,
              "width": 6,
              "height": 8,
              "image": "https://graph.facebook.com/1373104146/picture?type=large&access_token=10337532241|e83c95e8f5334533413589aa551ed2e8",
              "add_css_class": "fueled",
              "remove_css_class": ""
            },
            {
              "delay": 100,
              "duration": 200,
              "left": 30,
              "top": 128,
              "add_css_class": "easeIn",
              "remove_css_class": "easeOut flipped"
            }
          ]
        }
      ]
    }
  ],
  "active_augmentations": [],
  "phase": "tower",
  "items": {
    "marble_string_cheese": {
      "quantity": 0,
      "status": "disabled hidden"
    },
    "swiss_string_cheese": {
      "quantity": 0,
      "status": "disabled hidden"
    },
    "brie_string_cheese": {
      "quantity": 268,
      "status": "hidden"
    },
    "magical_string_cheese": {
      "quantity": 101,
      "status": ""
    },
    "gauntlet_string_cheese": {
      "quantity": 747,
      "status": "active",
      "can_purchase": true
    },
    "rift_gaunt_upgrade_a_stat_item": {
      "quantity": "7,514",
      "status": ""
    },
    "rift_gaunt_upgrade_b_stat_item": {
      "quantity": 798,
      "status": ""
    },
    "gauntlet_elixir_stat_item": {
      "quantity": 275,
      "status": ""
    },
    "rift_gauntlet_fuel_stat_item": {
      "quantity": 153,
      "status": "active"
    },
    "magic_essence_craft_item": {
      "quantity": 43,
      "status": ""
    },
    "gold_stat_item": {
      "quantity": "116,319,574",
      "status": ""
    },
    "shade_eclipse_resource_stat_item": {
      "quantity": 35,
      "status": ""
    },
    "total_eclipse_resource_stat_item": {
      "quantity": 77,
      "status": ""
    }
  },
  "retreat_consolation": [
    {
      "name": "Gold",
      "thumb": "https://www.mousehuntgame.com/images/items/stats/d8f90a569d52e7ea228ad0f1cc51516d.gif?cv=2",
      "quantity": "47,000"
    },
    {
      "name": "Tower Sigil",
      "thumb": "https://www.mousehuntgame.com/images/items/stats/7a7a027f2440400adb4e48d97e7b415a.gif?cv=2",
      "quantity": 50
    }
  ],
  "floor_numerals": [
    8,
    "",
    ""
  ],
  "has_bait_warning": null,
  "has_power_type_warning": null,
  "prestige_remaining_steps": 1,
  "boss_name": "Shade of the Eclipse Mouse"
};
const env_UU = {
  "state": "tower",
  "hunts_remaining": 68,
  "current_step": 21,
  "current_step_formatted": "21",
  "prestige": 1,
  "prestige_current_step": 21,
  "prestige_total_step": 141,
  "initial_hunt_remaining": 70,
  "floor": 2,
  "floor_name": "Thief",
  "floor_type": 2,
  "floor_prestige": 2,
  "floor_prestige_suffix": "st",
  "floor_steps": 20,
  "floor_percent": 5,
  "floor_data": [
    {
      "id": 1,
      "type": 1,
      "prestige": 1,
      "prestige_starting_step": 0,
      "name": "Floor 1",
      "length": 20,
      "start": 0
    },
    {
      "id": 2,
      "type": 2,
      "prestige": 1,
      "prestige_starting_step": 0,
      "name": "Floor 2",
      "length": 20,
      "start": 20
    },
    {
      "id": 3,
      "type": 3,
      "prestige": 1,
      "prestige_starting_step": 0,
      "name": "Floor 3",
      "length": 20,
      "start": 40
    },
    {
      "id": 4,
      "type": 4,
      "prestige": 1,
      "prestige_starting_step": 0,
      "name": "Floor 4",
      "length": 20,
      "start": 60
    },
    {
      "id": 5,
      "type": 5,
      "prestige": 1,
      "prestige_starting_step": 0,
      "name": "Floor 5",
      "length": 20,
      "start": 80
    }
  ],
  "is_at_eclipse": false,
  "power_up_data": {
    "long_stride": {
      "name": "Speed",
      "type": "long_stride",
      "description": "Upgrade to increase the number of steps you take with each catch.",
      "current_level": 5,
      "current_value": 6,
      "can_upgrade": null,
      "is_complete": null,
      "levels": [
        {
          "cost": [],
          "value": 1,
          "label": 1,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 30
            }
          ],
          "value": 2,
          "label": 2,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            }
          ],
          "value": 3,
          "label": 3,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            },
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 75
            }
          ],
          "value": 4,
          "label": 4,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 100
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 5,
          "label": 5,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 250
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 15
            }
          ],
          "value": 6,
          "label": 6,
          "is_current": true,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500,
              "name": "Tower Secrets",
              "percent": 100,
              "formatted_quantity": "500",
              "owned": "500",
              "has_enough": true
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 3,
              "name": "Core of the Eclipse",
              "percent": 0,
              "formatted_quantity": "3",
              "owned": "0",
              "has_enough": null
            }
          ],
          "value": 7,
          "label": 7,
          "is_visible": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 8,
          "label": 8
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 25
            }
          ],
          "value": 9,
          "label": 9
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 50
            }
          ],
          "value": 10,
          "label": 10
        }
      ],
      "increment": 1
    },
    "hunt_limit": {
      "name": "Sync",
      "type": "hunt_limit",
      "description": "Determines how well you stay in sync with the tower, increasing the number of hunts you can take before falling out of phase.",
      "current_level": 3,
      "current_value": 70,
      "can_upgrade": true,
      "is_complete": null,
      "levels": [
        {
          "cost": [],
          "value": 40,
          "label": 1,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 30
            }
          ],
          "value": 50,
          "label": 2,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            }
          ],
          "value": 60,
          "label": 3,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            },
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 75
            }
          ],
          "value": 70,
          "label": 4,
          "is_current": true,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 100,
              "name": "Tower Secrets",
              "percent": 100,
              "formatted_quantity": "100",
              "owned": "100",
              "has_enough": true
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 10,
              "name": "Fragment of the Eclipse",
              "percent": 100,
              "formatted_quantity": "10",
              "owned": "10",
              "has_enough": true
            }
          ],
          "value": 80,
          "label": 5,
          "is_visible": true,
          "can_upgrade": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 250
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 15
            }
          ],
          "value": 90,
          "label": 6
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 3
            }
          ],
          "value": 100,
          "label": 7
        }
      ],
      "increment": 10
    },
    "boss_extension": {
      "name": "Siphon",
      "type": "boss_extension",
      "description": "Extends the number of hunts remaining every time the Eclipse is caught.",
      "current_level": 3,
      "current_value": 20,
      "can_upgrade": null,
      "is_complete": null,
      "levels": [
        {
          "cost": [],
          "value": 5,
          "label": 1,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            }
          ],
          "value": 10,
          "label": 2,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_a_stat_item",
              "quantity": 100
            },
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 75
            }
          ],
          "value": 15,
          "label": 3,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 100
            },
            {
              "type": "shade_eclipse_resource_stat_item",
              "quantity": 10
            }
          ],
          "value": 20,
          "label": 4,
          "is_current": true,
          "is_active": true
        },
        {
          "cost": [
            {
              "type": "rift_gaunt_upgrade_b_stat_item",
              "quantity": 500,
              "name": "Tower Secrets",
              "percent": 100,
              "formatted_quantity": "500",
              "owned": "500",
              "has_enough": true
            },
            {
              "type": "total_eclipse_resource_stat_item",
              "quantity": 10,
              "name": "Core of the Eclipse",
              "percent": 0,
              "formatted_quantity": "10",
              "owned": "0",
              "has_enough": null
            }
          ],
          "value": 25,
          "label": 5,
          "is_visible": true
        }
      ],
      "increment": 5
    }
  },
  "is_eclipse_mode": true,
  "is_fuel_enabled": true,
  "can_retreat": true,
  "can_claim": false,
  "has_hunt_warning": null,
  "tracked_loot": {
    "431": {
      "m": 6795
    },
    "2898": {
      "m": 1,
      "f": 1
    }
  },
  "highest_floor_reached": 36,
  "ultimatum_highest_floor_reached": 2,
  "augmentation_data": {
    "hr": {
      "name": "Sigil Hunter",
      "description": "Adds 50% more Tower Sigils to cache.",
      "unlock_floor": 5,
      "unlock_message": "",
      "cost": [
        {
          "type": "gold_stat_item",
          "quantity": 250000
        }
      ],
      "is_locked": null
    },
    "sr": {
      "name": "Secret Research",
      "description": "Adds 50% more Tower Secrets to cache",
      "unlock_floor": 15,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_a_stat_item",
          "quantity": 500
        }
      ],
      "is_locked": null
    },
    "ss": {
      "name": "Super Siphon",
      "description": "Doubles the effect of Siphon",
      "unlock_floor": 20,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_a_stat_item",
          "quantity": 1000
        }
      ],
      "is_locked": null
    },
    "tu": {
      "name": "Ultimate Umbra",
      "description": "Confront a tougher challenge and earn more rewards. Failing to catch pushes you back!",
      "unlock_floor": 25,
      "unlock_message": "",
      "cost": [
        {
          "type": "shade_eclipse_resource_stat_item",
          "quantity": 75
        }
      ],
      "is_locked": null
    },
    "er": {
      "name": "Elixir Rain",
      "description": "Mice have a 50% chance of dropping an Elixir.",
      "unlock_floor": 40,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_b_stat_item",
          "quantity": 500
        }
      ],
      "is_locked": true
    },
    "sste": {
      "name": "String Stepping",
      "description": "Capturing the Terrified Adventurer gives x2 progress.",
      "unlock_floor": 65,
      "unlock_message": "",
      "cost": [
        {
          "type": "rift_gaunt_upgrade_b_stat_item",
          "quantity": 1500
        }
      ],
      "is_locked": true
    }
  },
  "sprite_layers": [
    {
      "type": "floors",
      "sprites": [
        {
          "id": "floor_1",
          "name": "Floor 1",
          "frames": [
            {
              "left": 0,
              "top": 83,
              "width": 380,
              "height": 150,
              "add_css_class": "floor floor_1 previous_floor first",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "floor_2",
          "name": "Floor 2",
          "frames": [
            {
              "left": 0,
              "top": -68,
              "width": 380,
              "height": 150,
              "add_css_class": "floor floor_2 active_floor",
              "remove_css_class": ""
            }
          ]
        }
      ]
    },
    {
      "type": "step",
      "sprites": [
        {
          "id": "step_31",
          "name": null,
          "frames": [
            {
              "left": 299,
              "top": -8,
              "width": 30,
              "height": 8,
              "add_css_class": "step ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_30",
          "name": null,
          "frames": [
            {
              "left": 330,
              "top": 0,
              "width": 30,
              "height": 8,
              "add_css_class": "step ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_29",
          "name": null,
          "frames": [
            {
              "left": 299,
              "top": 8,
              "width": 30,
              "height": 8,
              "add_css_class": "step ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_28",
          "name": null,
          "frames": [
            {
              "left": 268,
              "top": 15,
              "width": 30,
              "height": 8,
              "add_css_class": "step ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_27",
          "name": null,
          "frames": [
            {
              "left": 236,
              "top": 23,
              "width": 30,
              "height": 8,
              "add_css_class": "step ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_26",
          "name": null,
          "frames": [
            {
              "left": 205,
              "top": 30,
              "width": 30,
              "height": 8,
              "add_css_class": "step ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_25",
          "name": null,
          "frames": [
            {
              "left": 174,
              "top": 38,
              "width": 30,
              "height": 8,
              "add_css_class": "step ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_24",
          "name": null,
          "frames": [
            {
              "left": 143,
              "top": 45,
              "width": 30,
              "height": 8,
              "add_css_class": "step ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_23",
          "name": null,
          "frames": [
            {
              "left": 112,
              "top": 53,
              "width": 30,
              "height": 8,
              "add_css_class": "step ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_22",
          "name": null,
          "frames": [
            {
              "left": 80,
              "top": 60,
              "width": 30,
              "height": 8,
              "add_css_class": "step ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_21",
          "name": null,
          "frames": [
            {
              "left": 49,
              "top": 68,
              "width": 30,
              "height": 8,
              "add_css_class": "step current ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_20",
          "name": null,
          "frames": [
            {
              "left": 18,
              "top": 75,
              "width": 30,
              "height": 8,
              "add_css_class": "step past ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_19",
          "name": null,
          "frames": [
            {
              "left": 49,
              "top": 83,
              "width": 30,
              "height": 8,
              "add_css_class": "step past ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_18",
          "name": null,
          "frames": [
            {
              "left": 80,
              "top": 90,
              "width": 30,
              "height": 8,
              "add_css_class": "step past ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_17",
          "name": null,
          "frames": [
            {
              "left": 112,
              "top": 98,
              "width": 30,
              "height": 8,
              "add_css_class": "step past ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_16",
          "name": null,
          "frames": [
            {
              "left": 143,
              "top": 105,
              "width": 30,
              "height": 8,
              "add_css_class": "step past ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_15",
          "name": null,
          "frames": [
            {
              "left": 174,
              "top": 113,
              "width": 30,
              "height": 8,
              "add_css_class": "step past ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_14",
          "name": null,
          "frames": [
            {
              "left": 205,
              "top": 120,
              "width": 30,
              "height": 8,
              "add_css_class": "step past ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_13",
          "name": null,
          "frames": [
            {
              "left": 236,
              "top": 128,
              "width": 30,
              "height": 8,
              "add_css_class": "step past ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_12",
          "name": null,
          "frames": [
            {
              "left": 268,
              "top": 135,
              "width": 30,
              "height": 8,
              "add_css_class": "step past ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_11",
          "name": null,
          "frames": [
            {
              "left": 299,
              "top": 143,
              "width": 30,
              "height": 8,
              "add_css_class": "step past ",
              "remove_css_class": ""
            }
          ]
        },
        {
          "id": "step_10",
          "name": null,
          "frames": [
            {
              "left": 330,
              "top": 150,
              "width": 30,
              "height": 8,
              "add_css_class": "step past ",
              "remove_css_class": ""
            }
          ]
        }
      ]
    },
    {
      "type": "scores",
      "sprites": []
    },
    {
      "type": "friends",
      "sprites": []
    },
    {
      "type": "player",
      "sprites": [
        {
          "id": "player",
          "name": "Kaonashi<span>Step 21</span>",
          "frames": [
            {
              "left": 61,
              "top": 68,
              "width": 6,
              "height": 8,
              "image": "https://graph.facebook.com/100000107330804/picture?type=large&access_token=10337532241|e83c95e8f5334533413589aa551ed2e8",
              "add_css_class": "fueled",
              "remove_css_class": ""
            }
          ]
        }
      ]
    }
  ],
  "active_augmentations": {
    "hr": true,
    "sr": true,
    "ss": true,
    "tu": true
  },
  "phase": "tower",
  "items": {
    "marble_string_cheese": {
      "quantity": "0",
      "status": "disabled hidden"
    },
    "swiss_string_cheese": {
      "quantity": "18",
      "status": "hidden"
    },
    "brie_string_cheese": {
      "quantity": "53",
      "status": "hidden"
    },
    "magical_string_cheese": {
      "quantity": "11",
      "status": ""
    },
    "gauntlet_string_cheese": {
      "quantity": "221",
      "status": "active",
      "can_purchase": true
    },
    "rift_gaunt_upgrade_a_stat_item": {
      "quantity": "182",
      "status": ""
    },
    "rift_gaunt_upgrade_b_stat_item": {
      "quantity": "979",
      "status": ""
    },
    "gauntlet_elixir_stat_item": {
      "quantity": "24",
      "status": ""
    },
    "rift_gauntlet_fuel_stat_item": {
      "quantity": "328",
      "status": "active"
    },
    "magic_essence_craft_item": {
      "quantity": "340",
      "status": ""
    },
    "gold_stat_item": {
      "quantity": "9,255,921",
      "status": ""
    },
    "shade_eclipse_resource_stat_item": {
      "quantity": "36",
      "status": ""
    },
    "total_eclipse_resource_stat_item": {
      "quantity": "0",
      "status": "disabled"
    }
  },
  "retreat_consolation": [
    {
      "name": "Gold",
      "thumb": "https://www.mousehuntgame.com/images/items/stats/d8f90a569d52e7ea228ad0f1cc51516d.gif?cv=2",
      "quantity": "18,000"
    },
    {
      "name": "Tower Sigil",
      "thumb": "https://www.mousehuntgame.com/images/items/stats/7a7a027f2440400adb4e48d97e7b415a.gif?cv=2",
      "quantity": "7"
    },
    {
      "name": "Tower Sigil",
      "thumb": "https://www.mousehuntgame.com/images/items/stats/7a7a027f2440400adb4e48d97e7b415a.gif?cv=2",
      "quantity": "4"
    }
  ],
  "floor_numerals": [
    "2",
    "",
    ""
  ],
  "has_bait_warning": null,
  "has_power_type_warning": null,
  "prestige_remaining_steps": 120,
  "boss_name": "The Total Eclipse"
};
