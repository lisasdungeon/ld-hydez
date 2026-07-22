/**
 * Copyright © 2025 Lisa's Dungeon / LD
 * All Rights Reserved
 * 
 * Main Module Entry Point
 */

import { log } from "./utils.js";
import { registerSettings } from "./settings.js";
import { initHook, readyHook, renderMacroDirectoryHook, hotbarCollapseHook } from "./hooks.js";

// Register Handlebars helpers
function registerHelpers() {
  Handlebars.registerHelper('math', (a, b) => a * b);
  Handlebars.registerHelper('subtract', (a, b) => a - b);
  Handlebars.registerHelper('multiply', (a, b) => a * b);
  Handlebars.registerHelper('localize', (key, options) => {
    const data = options?.hash ?? {};
    const localized = game.i18n.localize(key);
    if (!localized || localized === key) return key;
    return foundry.utils.formatString(localized, data);
  });
  Handlebars.registerHelper('includes', (collection, value) => {
    if (Array.isArray(collection)) return collection.includes(value);
    return false;
  });
}

// Initialize on game init
Hooks.once("init", async () => {
  log("Initializing LD Hydez");
  registerSettings();
  registerHelpers();
  initHook();
});

// Ready hook
Hooks.once("ready", () => {
  log("LD Hydez ready");
  readyHook();
});

// Register event listeners
Hooks.on("renderMacroDirectory", renderMacroDirectoryHook);
Hooks.on("collapseHotbar", hotbarCollapseHook);
Hooks.on("expandHotbar", hotbarCollapseHook);

log("Module loaded");
