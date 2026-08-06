/**
 * Copyright © 2026 Lisa's Dungeon
 * Licensed under the MIT License. See LICENSE for details.
 *
 * Settings registration. The config Application class is loaded only when the
 * settings menu is opened (lazy menu shell).
 */

import { MODULE_ID, SETTINGS, DEFAULTS } from "./constants.js";
import { updateHotbarStyles } from "./styles.js";

function createLazyConfigMenu() {
  return class LazyHideHotbarConfig {
    constructor(...args) {
      this._args = args;
    }

    async render(...renderArgs) {
      const { HideHotbarConfig } = await import("./config.js");
      const app = new HideHotbarConfig(...this._args);
      return app.render(...renderArgs);
    }
  };
}

/**
 * Register all module settings
 */
export function registerSettings() {
  // Hidden slots configuration
  game.settings.register(MODULE_ID, SETTINGS.HIDDEN_SLOTS, {
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULTS.HIDDEN_SLOTS,
    onChange: () => updateHotbarStyles()
  });

  // Hide hotbar background
  game.settings.register(MODULE_ID, SETTINGS.HIDE_BACKGROUND, {
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.HIDE_BACKGROUND,
    onChange: () => updateHotbarStyles()
  });

  // Apply settings to GM
  game.settings.register(MODULE_ID, SETTINGS.APPLY_TO_GM, {
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.APPLY_TO_GM,
    onChange: () => updateHotbarStyles()
  });

  // Hide left controls
  game.settings.register(MODULE_ID, SETTINGS.HIDE_LEFT_CONTROLS, {
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.HIDE_LEFT_CONTROLS,
    onChange: () => updateHotbarStyles()
  });

  // Hide right controls
  game.settings.register(MODULE_ID, SETTINGS.HIDE_RIGHT_CONTROLS, {
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.HIDE_RIGHT_CONTROLS,
    onChange: () => updateHotbarStyles()
  });

  // Hide sidebar (right tabs)
  game.settings.register(MODULE_ID, SETTINGS.HIDE_SIDEBAR, {
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.HIDE_SIDEBAR,
    onChange: () => updateHotbarStyles()
  });

  // Hide scene controls (left tools)
  game.settings.register(MODULE_ID, SETTINGS.HIDE_SCENE_CONTROLS, {
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.HIDE_SCENE_CONTROLS,
    onChange: () => updateHotbarStyles()
  });

  // Hide entire hotbar
  game.settings.register(MODULE_ID, SETTINGS.HIDE_ENTIRE_HOTBAR, {
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.HIDE_ENTIRE_HOTBAR,
    onChange: () => updateHotbarStyles()
  });

  // Hide chat box
  game.settings.register(MODULE_ID, SETTINGS.HIDE_CHAT, {
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.HIDE_CHAT,
    onChange: () => updateHotbarStyles()
  });

  // Hide player list
  game.settings.register(MODULE_ID, SETTINGS.HIDE_PLAYERS, {
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.HIDE_PLAYERS,
    onChange: () => updateHotbarStyles()
  });

  // Per-player settings
  game.settings.register(MODULE_ID, SETTINGS.PER_PLAYER_SETTINGS, {
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULTS.PER_PLAYER_SETTINGS,
    onChange: () => updateHotbarStyles()
  });

  // Hide scene navigation
  game.settings.register(MODULE_ID, SETTINGS.HIDE_SCENE_NAVIGATION, {
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.HIDE_SCENE_NAVIGATION,
    onChange: () => updateHotbarStyles()
  });

  // Hide macro directory tab
  game.settings.register(MODULE_ID, SETTINGS.HIDE_MACRO_DIRECTORY, {
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.HIDE_MACRO_DIRECTORY,
    onChange: () => updateHotbarStyles()
  });

  // Hidden sidebar tabs
  game.settings.register(MODULE_ID, SETTINGS.HIDDEN_SIDEBAR_TABS, {
    scope: "world",
    config: false,
    type: Array,
    default: DEFAULTS.HIDDEN_SIDEBAR_TABS,
    onChange: () => updateHotbarStyles()
  });

  // Slot opacity
  game.settings.register(MODULE_ID, SETTINGS.OPACITY, {
    scope: "world",
    config: false,
    type: Number,
    default: DEFAULTS.OPACITY,
    range: {
      min: 0,
      max: 100,
      step: 5
    },
    onChange: () => updateHotbarStyles()
  });

  // Animation duration
  game.settings.register(MODULE_ID, SETTINGS.ANIMATION_DURATION, {
    scope: "world",
    config: false,
    type: Number,
    default: DEFAULTS.ANIMATION_DURATION,
    range: {
      min: 0,
      max: 1000,
      step: 50
    },
    onChange: () => updateHotbarStyles()
  });

  // Presets
  game.settings.register(MODULE_ID, SETTINGS.PRESETS, {
    scope: "world",
    config: false,
    type: Array,
    default: DEFAULTS.PRESETS
  });

  // Active preset
  game.settings.register(MODULE_ID, SETTINGS.ACTIVE_PRESET, {
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.ACTIVE_PRESET
  });

  // Hidden pages
  game.settings.register(MODULE_ID, SETTINGS.HIDDEN_PAGES, {
    scope: "world",
    config: false,
    type: Array,
    default: DEFAULTS.HIDDEN_PAGES,
    onChange: () => updateHotbarStyles()
  });

  // Register menu — Application class loaded on open
  game.settings.registerMenu(MODULE_ID, "config", {
    name: game.i18n.localize("LDH.Settings.Config.Name"),
    label: game.i18n.localize("LDH.Settings.Config.Label"),
    hint: game.i18n.localize("LDH.Settings.Config.Hint"),
    icon: "fas fa-eye-slash",
    type: createLazyConfigMenu(),
    restricted: true
  });
}

export { createLazyConfigMenu };
