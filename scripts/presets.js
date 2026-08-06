/**
 * Copyright © 2026 Lisa's Dungeon
 * Licensed under the MIT License. See LICENSE for details.
 *
 * Preset save/load/delete and config export/import for the GM configuration hub.
 * Split out of config.js to keep that file under the repo's line-count limit.
 * Each handler here is called with the HideHotbarConfig instance bound as `this`
 * (matching how ApplicationV2 invokes form/action handlers), so these must stay
 * plain functions rather than arrow functions.
 */

import { SETTINGS } from "./constants.js";
import {
  getSetting, setSetting, log, notify, localize,
  sanitizeHiddenSlots, sanitizeHiddenPages, sanitizeSidebarTabs, sanitizePerPlayerSettings
} from "./utils.js";
import { updateHotbarStyles } from "./styles.js";

const { DialogV2 } = foundry.applications.api;

export async function loadPreset(event) {
  const index = parseInt(event.target.value);
  const presets = getSetting(SETTINGS.PRESETS) || [];
  const preset = presets[index];

  if (!preset) return;

  const { config } = preset;
  await setSetting(SETTINGS.HIDDEN_SLOTS, config.hiddenSlots);
  await setSetting(SETTINGS.HIDE_BACKGROUND, config.hideBackground);
  await setSetting(SETTINGS.HIDE_LEFT_CONTROLS, config.hideLeftControls);
  await setSetting(SETTINGS.HIDE_RIGHT_CONTROLS, config.hideRightControls);
  await setSetting(SETTINGS.OPACITY, config.opacity);
  await setSetting(SETTINGS.HIDDEN_PAGES, config.hiddenPages || []);
  await setSetting(SETTINGS.ACTIVE_PRESET, preset.name);

  updateHotbarStyles();
  notify(localize("LDH.Notify.PresetLoaded", { name: preset.name }), "info");
  this.render();
}

export async function savePreset(event, target) {
  const result = await DialogV2.input({
    window: { title: "LDH.Dialog.SavePresetTitle" },
    content: `<input type="text" name="preset-name" placeholder="${localize("LDH.Dialog.SavePresetPlaceholder")}" autofocus>`
  });

  const name = result?.["preset-name"];
  if (!name) return;

  const presets = getSetting(SETTINGS.PRESETS) || [];
  const config = {
    hiddenSlots: getSetting(SETTINGS.HIDDEN_SLOTS),
    hideBackground: getSetting(SETTINGS.HIDE_BACKGROUND),
    hideLeftControls: getSetting(SETTINGS.HIDE_LEFT_CONTROLS),
    hideRightControls: getSetting(SETTINGS.HIDE_RIGHT_CONTROLS),
    opacity: getSetting(SETTINGS.OPACITY),
    hiddenPages: getSetting(SETTINGS.HIDDEN_PAGES)
  };

  presets.push({ name, config });
  await setSetting(SETTINGS.PRESETS, presets);
  notify(localize("LDH.Notify.PresetSaved", { name }), "info");
  this.render();
}

export async function deletePreset(event, target) {
  const select = this.element.querySelector("select[name='load-preset']");
  const index = parseInt(select?.value);
  const presets = getSetting(SETTINGS.PRESETS) || [];

  if (index < 0 || index >= presets.length || Number.isNaN(index)) return;

  const confirmed = await DialogV2.confirm({
    window: { title: "LDH.Dialog.DeletePresetTitle" },
    content: `<p>${localize("LDH.Dialog.DeletePresetContent", { name: presets[index].name })}</p>`
  });

  if (!confirmed) return;

  presets.splice(index, 1);
  await setSetting(SETTINGS.PRESETS, presets);
  notify(localize("LDH.Notify.PresetDeleted"), "info");
  this.render();
}

export async function exportConfig(event, target) {
  const config = {
    hiddenSlots: getSetting(SETTINGS.HIDDEN_SLOTS),
    hideBackground: getSetting(SETTINGS.HIDE_BACKGROUND),
    applyToGM: getSetting(SETTINGS.APPLY_TO_GM),
    hideLeftControls: getSetting(SETTINGS.HIDE_LEFT_CONTROLS),
    hideRightControls: getSetting(SETTINGS.HIDE_RIGHT_CONTROLS),
    hideSidebar: getSetting(SETTINGS.HIDE_SIDEBAR),
    hideSceneControls: getSetting(SETTINGS.HIDE_SCENE_CONTROLS),
    hideEntireHotbar: getSetting(SETTINGS.HIDE_ENTIRE_HOTBAR),
    hideChat: getSetting(SETTINGS.HIDE_CHAT),
    hidePlayers: getSetting(SETTINGS.HIDE_PLAYERS),
    hideSceneNavigation: getSetting(SETTINGS.HIDE_SCENE_NAVIGATION),
    hideMacroDirectory: getSetting(SETTINGS.HIDE_MACRO_DIRECTORY),
    opacity: getSetting(SETTINGS.OPACITY),
    animationDuration: getSetting(SETTINGS.ANIMATION_DURATION),
    hiddenPages: getSetting(SETTINGS.HIDDEN_PAGES),
    hiddenSidebarTabs: getSetting(SETTINGS.HIDDEN_SIDEBAR_TABS),
    presets: getSetting(SETTINGS.PRESETS),
    perPlayerSettings: getSetting(SETTINGS.PER_PLAYER_SETTINGS)
  };

  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ld-hydez-config.json";
  a.click();
  URL.revokeObjectURL(url);
  notify(localize("LDH.Notify.ConfigExported"), "info");
}

export async function importConfig(event, target) {
  const app = this;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config = JSON.parse(text);

      // Every one of these values ends up interpolated into a dynamically
      // generated, world-wide <style> element (see styles.js). An imported
      // file is untrusted input - shared "preset" files are exactly the
      // kind of thing that gets passed around a community - so every field
      // is validated/clamped the same way the form's own save path
      // (config.js's #onSubmit) already validates its own formData, rather
      // than being trusted as-is.
      if (config.hiddenSlots) await setSetting(SETTINGS.HIDDEN_SLOTS, sanitizeHiddenSlots(config.hiddenSlots));
      if (config.hideBackground !== undefined) await setSetting(SETTINGS.HIDE_BACKGROUND, Boolean(config.hideBackground));
      if (config.applyToGM !== undefined) await setSetting(SETTINGS.APPLY_TO_GM, Boolean(config.applyToGM));
      if (config.hideLeftControls !== undefined) await setSetting(SETTINGS.HIDE_LEFT_CONTROLS, Boolean(config.hideLeftControls));
      if (config.hideRightControls !== undefined) await setSetting(SETTINGS.HIDE_RIGHT_CONTROLS, Boolean(config.hideRightControls));
      if (config.hideSidebar !== undefined) await setSetting(SETTINGS.HIDE_SIDEBAR, Boolean(config.hideSidebar));
      if (config.hideSceneControls !== undefined) await setSetting(SETTINGS.HIDE_SCENE_CONTROLS, Boolean(config.hideSceneControls));
      if (config.hideEntireHotbar !== undefined) await setSetting(SETTINGS.HIDE_ENTIRE_HOTBAR, Boolean(config.hideEntireHotbar));
      if (config.hideChat !== undefined) await setSetting(SETTINGS.HIDE_CHAT, Boolean(config.hideChat));
      if (config.hidePlayers !== undefined) await setSetting(SETTINGS.HIDE_PLAYERS, Boolean(config.hidePlayers));
      if (config.hideSceneNavigation !== undefined) await setSetting(SETTINGS.HIDE_SCENE_NAVIGATION, Boolean(config.hideSceneNavigation));
      if (config.hideMacroDirectory !== undefined) await setSetting(SETTINGS.HIDE_MACRO_DIRECTORY, Boolean(config.hideMacroDirectory));
      if (config.opacity !== undefined) await setSetting(SETTINGS.OPACITY, Math.min(100, Math.max(0, parseInt(config.opacity, 10) || 0)));
      if (config.animationDuration !== undefined) await setSetting(SETTINGS.ANIMATION_DURATION, Math.min(1000, Math.max(0, parseInt(config.animationDuration, 10) || 0)));
      if (config.hiddenPages) await setSetting(SETTINGS.HIDDEN_PAGES, sanitizeHiddenPages(config.hiddenPages));
      if (config.hiddenSidebarTabs) await setSetting(SETTINGS.HIDDEN_SIDEBAR_TABS, sanitizeSidebarTabs(config.hiddenSidebarTabs));
      if (Array.isArray(config.presets)) {
        const presets = config.presets
          .filter(preset => preset && typeof preset.name === "string" && preset.config && typeof preset.config === "object")
          .map(preset => ({
            name: preset.name,
            config: {
              hiddenSlots: sanitizeHiddenSlots(preset.config.hiddenSlots),
              hideBackground: Boolean(preset.config.hideBackground),
              hideLeftControls: Boolean(preset.config.hideLeftControls),
              hideRightControls: Boolean(preset.config.hideRightControls),
              opacity: Math.min(100, Math.max(0, parseInt(preset.config.opacity, 10) || 0)),
              hiddenPages: sanitizeHiddenPages(preset.config.hiddenPages)
            }
          }));
        await setSetting(SETTINGS.PRESETS, presets);
      }
      if (config.perPlayerSettings) await setSetting(SETTINGS.PER_PLAYER_SETTINGS, sanitizePerPlayerSettings(config.perPlayerSettings));

      updateHotbarStyles();
      notify(localize("LDH.Notify.ConfigImported"), "info");
      app.render();
    } catch (error) {
      log(`Error importing config: ${error}`, "error");
      notify(localize("LDH.Notify.ImportFailed"), "error");
    }
  };

  input.click();
}
