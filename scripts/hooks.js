/**
 * Copyright © 2025 Lisa's Dungeon / LD
 * All Rights Reserved
 */

import { MODULE_ID, KEYBINDINGS } from "./constants.js";
import { HideHotbarConfig } from "./config.js";
import { updateHotbarStyles } from "./styles.js";
import { log } from "./utils.js";
import { escapeHtml } from "./utils/escapeHtml.js";

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
        new HideHotbarConfig().render(true);
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
    new HideHotbarConfig().render(true);
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
