/**
 * Copyright © 2026 Lisa's Dungeon
 * Licensed under the MIT License. See LICENSE for details.
 *
 * Hook handlers. Heavy config Application is dynamic-imported only when a GM
 * opens the hub (keybinding, macro directory button, or scene control).
 */

import { MODULE_ID, KEYBINDINGS } from "./constants.js";
import { updateHotbarStyles } from "./styles.js";
import { log } from "./utils.js";
import { escapeHtml } from "./utils/escapeHtml.js";

async function openConfigHub() {
  const { HideHotbarConfig } = await import("./config.js");
  return new HideHotbarConfig().render(true);
}

/**
 * Initialize hook - register keybindings
 */
export function initHook() {
  game.keybindings.register(MODULE_ID, KEYBINDINGS.OPEN_CONFIG, {
    name: game.i18n.localize("LDH.Settings.Config.Name"),
    hint: game.i18n.localize("LDH.Settings.Config.Hint"),
    editable: [
      { key: "KeyH", modifiers: ["Control", "Alt"] }
    ],
    onDown: () => {
      if (game.user.isGM) {
        openConfigHub();
      }
    },
    restricted: true,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });
}

/**
 * Ready hook - apply initial styles
 */
export function readyHook() {
  log("Applying hotbar styles");
  updateHotbarStyles();
}

/**
 * Render macro directory hook - add config button
 */
export function renderMacroDirectoryHook(app, html) {
  if (!game.user.isGM) return;

  const element = html?.[0] ?? html;
  if (!element?.querySelector) return;
  if (element.querySelector(".ld-hydez-config")) return;

  const button = document.createElement("button");
  button.className = "ld-hydez-config";
  button.type = "button";
  button.innerHTML = `<i class="fas fa-eye-slash"></i> ${escapeHtml(game.i18n.localize("LDH.Title"))}`;
  button.addEventListener("click", () => {
    openConfigHub();
  });

  let footer = element.querySelector(".directory-footer");
  if (!footer) {
    footer = document.createElement("footer");
    footer.className = "directory-footer";
    element.appendChild(footer);
  }
  footer.appendChild(button);
}

/**
 * Hotbar collapse/expand hook - reapply styles
 */
export function hotbarCollapseHook() {
  setTimeout(() => updateHotbarStyles(), 100);
}

/**
 * Scene controls hook - add a GM-only toolbar button that opens the config hub
 */
export function getSceneControlButtonsHook(controls) {
  if (!game.user.isGM) return;

  const tokenControls = controls?.tokens;
  if (!tokenControls?.tools) return;

  tokenControls.tools.ldHydez = {
    name: "ldHydez",
    title: game.i18n.localize("LDH.Title"),
    icon: "fas fa-eye-slash",
    order: Object.keys(tokenControls.tools).length,
    button: true,
    visible: true,
    onChange: () => openConfigHub()
  };
}

/** Exposed for unit tests. */
export { openConfigHub };
