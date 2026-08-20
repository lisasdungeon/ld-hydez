/**
 * Copyright © 2026 Lisa's Dungeon
 * Licensed under the MIT License. See LICENSE for details.
 *
 * Main Module Entry Point. Registers settings and light hooks on init/ready.
 * The config Application is dynamic-imported only when a GM opens it.
 */

import { log } from "./utils.js";
import { registerSettings } from "./settings.js";
import { initHook, readyHook, renderMacroDirectoryHook, hotbarCollapseHook, getSceneControlButtonsHook } from "./hooks.js";

// Register Handlebars helpers
export function registerHelpers() {
  Handlebars.registerHelper('subtract', (a, b) => a - b);
  Handlebars.registerHelper('multiply', (a, b) => a * b);
  Handlebars.registerHelper('add', (a, b) => a + b);
  // Note: no "localize" helper here. Foundry's core Handlebars environment
  // already registers a "localize" helper (plain lookup, or game.i18n.format
  // when hash args are passed) that every core template relies on
  // (hotbar, sidebar, players, scene navigation, scene controls, etc).
  // Registering our own under the same name overwrites Foundry's globally
  // for the rest of the session, breaking every core template render.
  Handlebars.registerHelper('includes', (collection, value) => {
    if (Array.isArray(collection)) return collection.includes(value);
    return false;
  });
}

export function onInit() {
  log("Initializing LD Hydez");
  registerSettings();
  registerHelpers();
  initHook();
}

export function onReady() {
  log("LD Hydez ready");
  readyHook();
}

export function registerModuleHooks() {
  Hooks.once("init", async () => {
    onInit();
  });

  Hooks.once("ready", () => {
    onReady();
  });

  Hooks.on("renderMacroDirectory", renderMacroDirectoryHook);
  Hooks.on("collapseHotbar", hotbarCollapseHook);
  Hooks.on("expandHotbar", hotbarCollapseHook);
  Hooks.on("getSceneControlButtons", getSceneControlButtonsHook);
}

registerModuleHooks();

log("Module loaded");
