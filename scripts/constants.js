/**
 * Copyright © 2026 Lisa's Dungeon
 * Licensed under the MIT License. See LICENSE for details.
 */

export const MODULE_ID = "ld-hydez";
export const MODULE_NAME = "LD Hydez";

export const SETTINGS = {
  HIDDEN_SLOTS: "hiddenSlots",
  HIDE_BACKGROUND: "hideBackground",
  APPLY_TO_GM: "applyToGM",
  HIDE_LEFT_CONTROLS: "hideLeftControls",
  HIDE_RIGHT_CONTROLS: "hideRightControls",
  HIDE_SIDEBAR: "hideSidebar",
  HIDE_SCENE_CONTROLS: "hideSceneControls",
  HIDE_ENTIRE_HOTBAR: "hideEntireHotbar",
  HIDE_CHAT: "hideChat",
  HIDE_PLAYERS: "hidePlayers",
  HIDE_SCENE_NAVIGATION: "hideSceneNavigation",
  HIDE_MACRO_DIRECTORY: "hideMacroDirectory",
  HIDDEN_SIDEBAR_TABS: "hiddenSidebarTabs",
  OPACITY: "slotOpacity",
  ANIMATION_DURATION: "animationDuration",
  PRESETS: "presets",
  ACTIVE_PRESET: "activePreset",
  HIDDEN_PAGES: "hiddenPages",
  PER_PLAYER_SETTINGS: "perPlayerSettings"
};

export const DEFAULTS = {
  HIDDEN_SLOTS: {},
  HIDE_BACKGROUND: false,
  APPLY_TO_GM: false,
  HIDE_LEFT_CONTROLS: false,
  HIDE_RIGHT_CONTROLS: false,
  HIDE_SIDEBAR: false,
  HIDE_SCENE_CONTROLS: false,
  HIDE_ENTIRE_HOTBAR: false,
  HIDE_CHAT: false,
  HIDE_PLAYERS: false,
  HIDE_SCENE_NAVIGATION: false,
  HIDE_MACRO_DIRECTORY: false,
  HIDDEN_SIDEBAR_TABS: [],
  OPACITY: 100,
  ANIMATION_DURATION: 300,
  PRESETS: [],
  ACTIVE_PRESET: null,
  HIDDEN_PAGES: [],
  PER_PLAYER_SETTINGS: {}
};

export const HOTBAR = {
  MAX_SLOTS: 50,
  SLOTS_PER_PAGE: 10,
  MAX_PAGES: 5
};

export const KEYBINDINGS = {
  OPEN_CONFIG: "openConfig"
};

export const CSS_IDS = {
  STYLE_ELEMENT: "hide-hotbar-buttons-style"
};

export const SIDEBAR_TAB_IDS = Object.freeze([
  "chat", "combat", "scenes", "actors", "items", "journal",
  "tables", "cards", "playlists", "compendium", "settings", "macros"
]);
