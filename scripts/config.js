/**
 * Copyright © 2025 Lisa's Dungeon / LD
 * All Rights Reserved
 */

import { MODULE_ID, SETTINGS, HOTBAR } from "./constants.js";
import { getSetting, setSetting, isValidSlot, log, notify, localize } from "./utils.js";
import { updateHotbarStyles } from "./styles.js";

/**
 * Configuration form for Hide Hotbar Buttons
 */
export class HideHotbarConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("LDH.Config.Title"),
      id: "hide-hotbar-config",
      template: `modules/${MODULE_ID}/templates/settings.html`,
      width: 700,
      height: "auto",
      closeOnSubmit: true,
      tabs: [
        {
          navSelector: ".main-tabs",
          contentSelector: ".content",
          initial: "gm"
        }
      ]
    });
  }

  getData() {
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

  activateListeners(html) {
    super.activateListeners(html);

    // Select all/none buttons
    html.find(".select-all-slots").click(() => this._selectAllSlots(html, true));
    html.find(".select-none-slots").click(() => this._selectAllSlots(html, false));
    
    // Page selection
    html.find(".page-checkbox").change((ev) => this._onPageCheckboxChange(ev, html));
    
    // Preset buttons
    html.find(".save-preset").click(() => this._savePreset(html));
    html.find(".load-preset").change((ev) => this._loadPreset(ev));
    html.find(".delete-preset").click(() => this._deletePreset(html));
    
    // Export/Import
    html.find(".export-config").click(() => this._exportConfig());
    html.find(".import-config").click(() => this._importConfig());

    // Per-player controls
    html.find(".select-all-player-slots").click((ev) => this._selectAllPlayerSlots(ev, html, true));
    html.find(".select-none-player-slots").click((ev) => this._selectAllPlayerSlots(ev, html, false));
    html.find(".page-checkbox-player").change((ev) => this._onPlayerPageCheckboxChange(ev, html));
  }

  _selectAllSlots(html, select) {
    html.find("input[name^='slot-']").prop("checked", select);
  }

  _onPageCheckboxChange(event, html) {
    const page = parseInt(event.target.dataset.page);
    const checked = event.target.checked;
    const slots = Array.from({ length: 10 }, (_, i) => (page - 1) * 10 + i + 1);
    
    slots.forEach(slot => {
      html.find(`input[name='slot-${slot}']`).prop("checked", checked);
    });
  }

  _selectAllPlayerSlots(event, html, select) {
    const playerId = $(event.target).data("player");
    html.find(`input[name^='player-${playerId}-slot-']`).prop("checked", select);
  }

  _onPlayerPageCheckboxChange(event, html) {
    const playerId = $(event.target).data("player");
    const page = parseInt($(event.target).data("page"));
    const checked = event.target.checked;
    const slots = Array.from({ length: 10 }, (_, i) => (page - 1) * 10 + i + 1);
    
    slots.forEach(slot => {
      html.find(`input[name='player-${playerId}-slot-${slot}']`).prop("checked", checked);
    });
  }

  async _savePreset() {
    const name = await Dialog.prompt({
      title: localize("LDH.Dialog.SavePresetTitle"),
      content: `<input type="text" name="preset-name" placeholder="${localize("LDH.Dialog.SavePresetPlaceholder")}" autofocus>`,
      callback: (html) => html.find("input[name='preset-name']").val()
    });

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

  async _loadPreset(event) {
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

  async _deletePreset(html) {
    const select = html.find("select[name='load-preset']");
    const index = parseInt(select.val());
    const presets = getSetting(SETTINGS.PRESETS) || [];

    if (index < 0 || index >= presets.length) return;

    const confirmed = await Dialog.confirm({
      title: localize("LDH.Dialog.DeletePresetTitle"),
      content: `<p>${localize("LDH.Dialog.DeletePresetContent", { name: presets[index].name })}</p>`
    });

    if (!confirmed) return;

    presets.splice(index, 1);
    await setSetting(SETTINGS.PRESETS, presets);
    notify(localize("LDH.Notify.PresetDeleted"), "info");
    this.render();
  }

  async _exportConfig() {
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

  async _importConfig() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const config = JSON.parse(text);

        // Validate and apply
        if (config.hiddenSlots) await setSetting(SETTINGS.HIDDEN_SLOTS, config.hiddenSlots);
        if (config.hideBackground !== undefined) await setSetting(SETTINGS.HIDE_BACKGROUND, config.hideBackground);
        if (config.applyToGM !== undefined) await setSetting(SETTINGS.APPLY_TO_GM, config.applyToGM);
        if (config.hideLeftControls !== undefined) await setSetting(SETTINGS.HIDE_LEFT_CONTROLS, config.hideLeftControls);
        if (config.hideRightControls !== undefined) await setSetting(SETTINGS.HIDE_RIGHT_CONTROLS, config.hideRightControls);
        if (config.hideSidebar !== undefined) await setSetting(SETTINGS.HIDE_SIDEBAR, config.hideSidebar);
        if (config.hideSceneControls !== undefined) await setSetting(SETTINGS.HIDE_SCENE_CONTROLS, config.hideSceneControls);
        if (config.hideEntireHotbar !== undefined) await setSetting(SETTINGS.HIDE_ENTIRE_HOTBAR, config.hideEntireHotbar);
        if (config.hideChat !== undefined) await setSetting(SETTINGS.HIDE_CHAT, config.hideChat);
        if (config.hidePlayers !== undefined) await setSetting(SETTINGS.HIDE_PLAYERS, config.hidePlayers);
        if (config.hideSceneNavigation !== undefined) await setSetting(SETTINGS.HIDE_SCENE_NAVIGATION, config.hideSceneNavigation);
        if (config.hideMacroDirectory !== undefined) await setSetting(SETTINGS.HIDE_MACRO_DIRECTORY, config.hideMacroDirectory);
        if (config.opacity !== undefined) await setSetting(SETTINGS.OPACITY, config.opacity);
        if (config.animationDuration !== undefined) await setSetting(SETTINGS.ANIMATION_DURATION, config.animationDuration);
        if (config.hiddenPages) await setSetting(SETTINGS.HIDDEN_PAGES, config.hiddenPages);
        if (config.hiddenSidebarTabs) await setSetting(SETTINGS.HIDDEN_SIDEBAR_TABS, config.hiddenSidebarTabs);
        if (config.presets) await setSetting(SETTINGS.PRESETS, config.presets);
        if (config.perPlayerSettings) await setSetting(SETTINGS.PER_PLAYER_SETTINGS, config.perPlayerSettings);

        updateHotbarStyles();
        notify(localize("LDH.Notify.ConfigImported"), "info");
        this.render();
      } catch (error) {
        log(`Error importing config: ${error}`, "error");
        notify(localize("LDH.Notify.ImportFailed"), "error");
      }
    };

    input.click();
  }

  async _updateObject(event, formData) {
    try {
      const hiddenSlots = {};
      const hiddenPages = [];
      const hiddenSidebarTabs = [];
      const perPlayerSettings = {};

      // Process slots
      for (let i = 1; i <= HOTBAR.MAX_SLOTS; i++) {
        if (!isValidSlot(i)) continue;
        hiddenSlots[i] = formData[`slot-${i}`] || false;
      }

      // Process pages
      for (let i = 1; i <= HOTBAR.MAX_PAGES; i++) {
        if (formData[`page-${i}`]) {
          hiddenPages.push(i);
        }
      }

      // Process sidebar tabs
      const tabIds = ["chat", "combat", "scenes", "actors", "items", "journal", "tables", "cards", "playlists", "compendium", "settings", "macros"];
      tabIds.forEach(id => {
        const key = `sidebar-tab-${id}`;
        if (formData[key]) {
          hiddenSidebarTabs.push(id);
        }
      });

      // Process per-player settings
      game.users.filter(u => !u.isGM).forEach(user => {
        const playerSettings = {
          hideSceneControls: formData[`player-${user.id}-hideSceneControls`] || false,
          hideSidebar: formData[`player-${user.id}-hideSidebar`] || false,
          hideEntireHotbar: formData[`player-${user.id}-hideEntireHotbar`] || false,
          hideBackground: formData[`player-${user.id}-hideBackground`] || false,
          hideLeftControls: formData[`player-${user.id}-hideLeftControls`] || false,
          hideRightControls: formData[`player-${user.id}-hideRightControls`] || false,
          hideChat: formData[`player-${user.id}-hideChat`] || false,
          hidePlayers: formData[`player-${user.id}-hidePlayers`] || false,
          hideSceneNavigation: formData[`player-${user.id}-hideSceneNavigation`] || false,
          hiddenSlots: {},
          hiddenPages: [],
          hiddenSidebarTabs: []
        };

        // Process player-specific slots
        for (let i = 1; i <= HOTBAR.MAX_SLOTS; i++) {
          if (formData[`player-${user.id}-slot-${i}`]) {
            playerSettings.hiddenSlots[i] = true;
          }
        }

        // Process player-specific pages
        for (let i = 1; i <= HOTBAR.MAX_PAGES; i++) {
          if (formData[`player-${user.id}-page-${i}`]) {
            playerSettings.hiddenPages.push(i);
          }
        }

        // Process player-specific sidebar tabs
      const sidebarTabIds = ["chat", "combat", "scenes", "actors", "items", "journal", "tables", "cards", "playlists", "compendium", "settings", "macros"];
      sidebarTabIds.forEach(id => {
        const key = `player-${user.id}-sidebar-tab-${id}`;
        if (formData[key]) {
          playerSettings.hiddenSidebarTabs.push(id);
        }
        });

        perPlayerSettings[user.id] = playerSettings;
      });

      log(`Saving settings. FormData:`, "log");
      log(`Hidden tabs to save: ${hiddenSidebarTabs.join(", ")}`);

      await setSetting(SETTINGS.HIDDEN_SLOTS, hiddenSlots);
      await setSetting(SETTINGS.HIDE_BACKGROUND, formData.hideBackground || false);
      await setSetting(SETTINGS.APPLY_TO_GM, formData.applyToGM || false);
      await setSetting(SETTINGS.HIDE_LEFT_CONTROLS, formData.hideLeftControls || false);
      await setSetting(SETTINGS.HIDE_RIGHT_CONTROLS, formData.hideRightControls || false);
      await setSetting(SETTINGS.HIDE_SIDEBAR, formData.hideSidebar || false);
      await setSetting(SETTINGS.HIDE_SCENE_CONTROLS, formData.hideSceneControls || false);
      await setSetting(SETTINGS.HIDE_ENTIRE_HOTBAR, formData.hideEntireHotbar || false);
      await setSetting(SETTINGS.HIDE_CHAT, formData.hideChat || false);
      await setSetting(SETTINGS.HIDE_PLAYERS, formData.hidePlayers || false);
      await setSetting(SETTINGS.HIDE_SCENE_NAVIGATION, formData.hideSceneNavigation || false);
      await setSetting(SETTINGS.HIDE_MACRO_DIRECTORY, formData.hideMacroDirectory || false);
      await setSetting(SETTINGS.HIDDEN_SIDEBAR_TABS, hiddenSidebarTabs);
      await setSetting(SETTINGS.OPACITY, parseInt(formData.opacity) || 100);
      await setSetting(SETTINGS.ANIMATION_DURATION, parseInt(formData.animationDuration) || 300);
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
