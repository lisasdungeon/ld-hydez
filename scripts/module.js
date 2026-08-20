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
  // Do not register subtract/multiply/add globally. Those names collide with
  // other modules and are unused after slot ranges were precomputed in context.
  // Do not register localize. Foundry already provides it for core templates.
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
