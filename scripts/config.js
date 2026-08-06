/**
 * Copyright © 2026 Lisa's Dungeon
 * Licensed under the MIT License. See LICENSE for details.
 */

import { MODULE_ID, SETTINGS, HOTBAR, SIDEBAR_TAB_IDS } from "./constants.js";
import { getSetting, setSetting, isValidSlot, log, notify, localize } from "./utils.js";
import { updateHotbarStyles } from "./styles.js";
import { loadPreset, savePreset, deletePreset, exportConfig, importConfig } from "./presets.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Configuration form for Hide Hotbar Buttons
 */
export class HideHotbarConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "hide-hotbar-config",
    tag: "form",
    classes: ["ld-hydez-config"],
    window: {
      title: "LDH.Config.Title",
      icon: "fas fa-eye-slash"
    },
    position: {
      width: 700,
      height: "auto"
    },
    form: {
      handler: HideHotbarConfig.#onSubmit,
      closeOnSubmit: true
    },
    actions: {
      selectAllSlots: HideHotbarConfig.#onSelectAllSlots,
      selectNoneSlots: HideHotbarConfig.#onSelectNoneSlots,
      savePreset,
      deletePreset,
      exportConfig,
      importConfig,
      selectAllPlayerSlots: HideHotbarConfig.#onSelectAllPlayerSlots,
      selectNonePlayerSlots: HideHotbarConfig.#onSelectNonePlayerSlots
    }
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/settings.html`,
      root: true,
      scrollable: [".content"]
    }
  };

  static TABS = {
    primary: {
      tabs: [{ id: "gm" }, { id: "players" }],
      initial: "gm"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const hiddenSlots = getSetting(SETTINGS.HIDDEN_SLOTS);
    const hideBackground = getSetting(SETTINGS.HIDE_BACKGROUND);
    const applyToGM = getSetting(SETTINGS.APPLY_TO_GM);
    const hideLeftControls = getSetting(SETTINGS.HIDE_LEFT_CONTROLS);
    const hideRightControls = getSetting(SETTINGS.HIDE_RIGHT_CONTROLS);
    const hideSidebar = getSetting(SETTINGS.HIDE_SIDEBAR);
    const hideSceneControls = getSetting(SETTINGS.HIDE_SCENE_CONTROLS);
    const hideEntireHotbar = getSetting(SETTINGS.HIDE_ENTIRE_HOTBAR);
    const hideChat = getSetting(SETTINGS.HIDE_CHAT);
    const hidePlayers = getSetting(SETTINGS.HIDE_PLAYERS);
    const hideSceneNavigation = getSetting(SETTINGS.HIDE_SCENE_NAVIGATION);
    const hideMacroDirectory = getSetting(SETTINGS.HIDE_MACRO_DIRECTORY);
    const hiddenSidebarTabs = getSetting(SETTINGS.HIDDEN_SIDEBAR_TABS) || [];
    const opacity = getSetting(SETTINGS.OPACITY);
    const animationDuration = getSetting(SETTINGS.ANIMATION_DURATION);
    const hiddenPages = getSetting(SETTINGS.HIDDEN_PAGES);
    const presets = getSetting(SETTINGS.PRESETS);
    const activePreset = getSetting(SETTINGS.ACTIVE_PRESET);
    const perPlayerSettings = getSetting(SETTINGS.PER_PLAYER_SETTINGS) || {};

    log(`getData: hiddenSidebarTabs from settings: ${hiddenSidebarTabs.join(", ")}`);

    // Build slots array
    const slots = [];
    for (let i = 1; i <= HOTBAR.MAX_SLOTS; i++) {
      slots.push({
        n: i,
        hidden: hiddenSlots[i] || false,
        page: Math.ceil(i / HOTBAR.SLOTS_PER_PAGE)
      });
    }

    // Build pages array
    const pages = [];
    for (let i = 1; i <= HOTBAR.MAX_PAGES; i++) {
      pages.push({
        n: i,
        hidden: hiddenPages.includes(i)
      });
    }

    const sidebarTabDefinitions = [
      { id: "chat", label: game.i18n.localize("LDH.Sidebar.Chat"), icon: "fas fa-comments" },
      { id: "combat", label: game.i18n.localize("LDH.Sidebar.Combat"), icon: "fas fa-swords" },
      { id: "scenes", label: game.i18n.localize("LDH.Sidebar.Scenes"), icon: "fas fa-map" },
      { id: "actors", label: game.i18n.localize("LDH.Sidebar.Actors"), icon: "fas fa-users" },
      { id: "items", label: game.i18n.localize("LDH.Sidebar.Items"), icon: "fas fa-suitcase" },
      { id: "journal", label: game.i18n.localize("LDH.Sidebar.Journal"), icon: "fas fa-book-open" },
      { id: "tables", label: game.i18n.localize("LDH.Sidebar.Tables"), icon: "fas fa-th-list" },
      { id: "cards", label: game.i18n.localize("LDH.Sidebar.Cards"), icon: "fas fa-id-card" },
      { id: "playlists", label: game.i18n.localize("LDH.Sidebar.Playlists"), icon: "fas fa-music" },
      { id: "compendium", label: game.i18n.localize("LDH.Sidebar.Compendium"), icon: "fas fa-atlas" },
      { id: "settings", label: game.i18n.localize("LDH.Sidebar.Settings"), icon: "fas fa-cogs" },
      { id: "macros", label: game.i18n.localize("LDH.Sidebar.Macros"), icon: "fas fa-code" }
    ];
    const effectiveHiddenSidebarTabs = new Set(hiddenSidebarTabs);

    if (hideMacroDirectory) {
      effectiveHiddenSidebarTabs.add("macros");
    }

    // Build sidebar tabs array
    const sidebarTabs = sidebarTabDefinitions.map(tab => ({
      ...tab,
      hidden: effectiveHiddenSidebarTabs.has(tab.id)
    }));

    // Build players array with their settings
    const players = game.users.filter(u => !u.isGM).map(user => {
      const playerSettings = perPlayerSettings[user.id] || {};
      const playerHiddenSlots = playerSettings.hiddenSlots || {};
      const playerHiddenPages = playerSettings.hiddenPages || [];

      return {
        id: user.id,
        name: user.name,
        color: user.color,
        settings: playerSettings,
        slots: slots.map(slot => ({
          ...slot,
          hidden: Boolean(playerHiddenSlots[slot.n])
        })),
        pages: pages.map(page => ({
          ...page,
          hidden: playerHiddenPages.includes(page.n)
        })),
        sidebarTabs: sidebarTabDefinitions.map(tab => ({
          ...tab,
          hidden: (playerSettings.hiddenSidebarTabs || []).includes(tab.id)
        }))
      };
    });

    const presetOptions = (presets || []).map((preset, index) => ({
      ...preset,
      index,
      selected: activePreset === preset.name
    }));

    return {
      ...context,
      slots,
      pages,
      sidebarTabs,
      players,
      hideBackground,
      applyToGM,
      hideLeftControls,
      hideRightControls,
      hideSidebar,
      hideSceneControls,
      hideEntireHotbar,
      hideChat,
      hidePlayers,
      hideSceneNavigation,
      hideMacroDirectory,
      opacity,
      animationDuration,
      presets: presetOptions,
      activePreset,
      title: localize("LDH.Config.Header"),
      gmTabLabel: localize("LDH.Config.GMTab"),
      playerTabLabel: localize("LDH.Config.PlayerTab"),
      globalHeader: localize("LDH.Config.GlobalHeader"),
      globalNotes: localize("LDH.Config.GlobalNotes"),
      generalHeader: localize("LDH.Config.GeneralHeader"),
      uiHeader: localize("LDH.Config.UIHeader"),
      sidebarHeader: localize("LDH.Config.SidebarHeader"),
      hotbarSlotsHeader: localize("LDH.Config.HotbarSlotsHeader"),
      hotbarPagesHeader: localize("LDH.Config.HotbarPagesHeader"),
      presetsHeader: localize("LDH.Config.PresetsHeader"),
      advancedHeader: localize("LDH.Config.AdvancedHeader"),
      noPlayersText: localize("LDH.Config.NoPlayers")
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    this.element.querySelectorAll(".page-checkbox").forEach(el => {
      el.addEventListener("change", (ev) => this._onPageCheckboxChange(ev));
    });
    this.element.querySelectorAll(".load-preset").forEach(el => {
      el.addEventListener("change", (ev) => loadPreset.call(this, ev));
    });
    this.element.querySelectorAll(".page-checkbox-player").forEach(el => {
      el.addEventListener("change", (ev) => this._onPlayerPageCheckboxChange(ev));
    });
  }

  _onPageCheckboxChange(event) {
    const page = parseInt(event.target.dataset.page);
    const checked = event.target.checked;
    const slots = Array.from({ length: HOTBAR.SLOTS_PER_PAGE }, (_, i) => (page - 1) * HOTBAR.SLOTS_PER_PAGE + i + 1);

    slots.forEach(slot => {
      const input = this.element.querySelector(`input[name='slot-${slot}']`);
      if (input) input.checked = checked;
    });
  }

  _onPlayerPageCheckboxChange(event) {
    const playerId = event.target.dataset.player;
    const page = parseInt(event.target.dataset.page);
    const checked = event.target.checked;
    const slots = Array.from({ length: HOTBAR.SLOTS_PER_PAGE }, (_, i) => (page - 1) * HOTBAR.SLOTS_PER_PAGE + i + 1);

    slots.forEach(slot => {
      const input = this.element.querySelector(`input[name='player-${playerId}-slot-${slot}']`);
      if (input) input.checked = checked;
    });
  }

  static #onSelectAllSlots(event, target) {
    this.element.querySelectorAll("input[name^='slot-']").forEach(el => { el.checked = true; });
  }

  static #onSelectNoneSlots(event, target) {
    this.element.querySelectorAll("input[name^='slot-']").forEach(el => { el.checked = false; });
  }

  static #onSelectAllPlayerSlots(event, target) {
    const playerId = target.dataset.player;
    this.element.querySelectorAll(`input[name^='player-${playerId}-slot-']`).forEach(el => { el.checked = true; });
  }

  static #onSelectNonePlayerSlots(event, target) {
    const playerId = target.dataset.player;
    this.element.querySelectorAll(`input[name^='player-${playerId}-slot-']`).forEach(el => { el.checked = false; });
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    try {
      const hiddenSlots = {};
      const hiddenPages = [];
      const hiddenSidebarTabs = [];
      const perPlayerSettings = {};

      // Process slots
      for (let i = 1; i <= HOTBAR.MAX_SLOTS; i++) {
        if (!isValidSlot(i)) continue;
        hiddenSlots[i] = data[`slot-${i}`] || false;
      }

      // Process pages
      for (let i = 1; i <= HOTBAR.MAX_PAGES; i++) {
        if (data[`page-${i}`]) {
          hiddenPages.push(i);
        }
      }

      // Process sidebar tabs
      SIDEBAR_TAB_IDS.forEach(id => {
        const key = `sidebar-tab-${id}`;
        if (data[key]) {
          hiddenSidebarTabs.push(id);
        }
      });

      // Process per-player settings
      game.users.filter(u => !u.isGM).forEach(user => {
        const playerSettings = {
          hideSceneControls: data[`player-${user.id}-hideSceneControls`] || false,
          hideSidebar: data[`player-${user.id}-hideSidebar`] || false,
          hideEntireHotbar: data[`player-${user.id}-hideEntireHotbar`] || false,
          hideBackground: data[`player-${user.id}-hideBackground`] || false,
          hideLeftControls: data[`player-${user.id}-hideLeftControls`] || false,
          hideRightControls: data[`player-${user.id}-hideRightControls`] || false,
          hideChat: data[`player-${user.id}-hideChat`] || false,
          hidePlayers: data[`player-${user.id}-hidePlayers`] || false,
          hideSceneNavigation: data[`player-${user.id}-hideSceneNavigation`] || false,
          hiddenSlots: {},
          hiddenPages: [],
          hiddenSidebarTabs: []
        };

        // Process player-specific slots
        for (let i = 1; i <= HOTBAR.MAX_SLOTS; i++) {
          if (data[`player-${user.id}-slot-${i}`]) {
            playerSettings.hiddenSlots[i] = true;
          }
        }

        // Process player-specific pages
        for (let i = 1; i <= HOTBAR.MAX_PAGES; i++) {
          if (data[`player-${user.id}-page-${i}`]) {
            playerSettings.hiddenPages.push(i);
          }
        }

        // Process player-specific sidebar tabs
        SIDEBAR_TAB_IDS.forEach(id => {
          const key = `player-${user.id}-sidebar-tab-${id}`;
          if (data[key]) {
            playerSettings.hiddenSidebarTabs.push(id);
          }
        });

        // Only persist an override for this player if something was actually
        // set for them. Otherwise every save (even one that never touches the
        // Player tab) would write an all-false/empty entry for every player,
        // and styles.js treats the mere presence of an entry as "this player
        // has an override" - silently blocking the global settings from ever
        // reaching them again.
        const hasOverride = playerSettings.hideSceneControls || playerSettings.hideSidebar ||
          playerSettings.hideEntireHotbar || playerSettings.hideBackground ||
          playerSettings.hideLeftControls || playerSettings.hideRightControls ||
          playerSettings.hideChat || playerSettings.hidePlayers ||
          playerSettings.hideSceneNavigation ||
          Object.keys(playerSettings.hiddenSlots).length > 0 ||
          playerSettings.hiddenPages.length > 0 ||
          playerSettings.hiddenSidebarTabs.length > 0;

        if (hasOverride) {
          perPlayerSettings[user.id] = playerSettings;
        }
      });

      log(`Saving settings. FormData:`, "log");
      log(`Hidden tabs to save: ${hiddenSidebarTabs.join(", ")}`);

      await setSetting(SETTINGS.HIDDEN_SLOTS, hiddenSlots);
      await setSetting(SETTINGS.HIDE_BACKGROUND, data.hideBackground || false);
      await setSetting(SETTINGS.APPLY_TO_GM, data.applyToGM || false);
      await setSetting(SETTINGS.HIDE_LEFT_CONTROLS, data.hideLeftControls || false);
      await setSetting(SETTINGS.HIDE_RIGHT_CONTROLS, data.hideRightControls || false);
      await setSetting(SETTINGS.HIDE_SIDEBAR, data.hideSidebar || false);
      await setSetting(SETTINGS.HIDE_SCENE_CONTROLS, data.hideSceneControls || false);
      await setSetting(SETTINGS.HIDE_ENTIRE_HOTBAR, data.hideEntireHotbar || false);
      await setSetting(SETTINGS.HIDE_CHAT, data.hideChat || false);
      await setSetting(SETTINGS.HIDE_PLAYERS, data.hidePlayers || false);
      await setSetting(SETTINGS.HIDE_SCENE_NAVIGATION, data.hideSceneNavigation || false);
      await setSetting(SETTINGS.HIDE_MACRO_DIRECTORY, data.hideMacroDirectory || false);
      await setSetting(SETTINGS.HIDDEN_SIDEBAR_TABS, hiddenSidebarTabs);
      await setSetting(SETTINGS.OPACITY, parseInt(data.opacity) || 100);
      await setSetting(SETTINGS.ANIMATION_DURATION, parseInt(data.animationDuration) || 300);
      await setSetting(SETTINGS.HIDDEN_PAGES, hiddenPages);
      await setSetting(SETTINGS.PER_PLAYER_SETTINGS, perPlayerSettings);

      updateHotbarStyles();
      notify(localize("LDH.Notify.SettingsSaved"), "info");
    } catch (error) {
      log(`Error saving settings: ${error}`, "error");
      notify(localize("LDH.Notify.SaveFailed"), "error");
    }
  }
}
