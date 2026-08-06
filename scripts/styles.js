/**
 * Copyright © 2026 Lisa's Dungeon
 * Licensed under the MIT License. See LICENSE for details.
 */

import { SETTINGS } from "./constants.js";
import { getSetting, updateStyleElement, getSlotsForPage, log } from "./utils.js";

/**
 * Update hotbar styles based on current settings
 */
export function updateHotbarStyles() {
  const perPlayerSettings = getSetting(SETTINGS.PER_PLAYER_SETTINGS) || {};
  const currentUserId = game.user.id;
  const isGM = game.user.isGM;
  
  // Check if current user has per-player settings
  const playerSettings = perPlayerSettings[currentUserId];
  
  // Use per-player settings if available, otherwise fall back to global settings
  let hiddenSlots, hideBackground, hideLeftControls, hideRightControls, hideSidebar;
  let hideSceneControls, hideEntireHotbar, hideChat, hidePlayers, hideSceneNavigation;
  let hiddenPages, hiddenSidebarTabs;
  
  if (playerSettings && !isGM) {
    // Use per-player settings for this player
    hiddenSlots = playerSettings.hiddenSlots || {};
    hideBackground = playerSettings.hideBackground;
    hideLeftControls = playerSettings.hideLeftControls;
    hideRightControls = playerSettings.hideRightControls;
    hideSidebar = playerSettings.hideSidebar;
    hideSceneControls = playerSettings.hideSceneControls;
    hideEntireHotbar = playerSettings.hideEntireHotbar;
    hideChat = playerSettings.hideChat;
    hidePlayers = playerSettings.hidePlayers;
    hideSceneNavigation = playerSettings.hideSceneNavigation;
    hiddenPages = playerSettings.hiddenPages || [];
    hiddenSidebarTabs = playerSettings.hiddenSidebarTabs || [];
  } else {
    // Use global settings
    hiddenSlots = getSetting(SETTINGS.HIDDEN_SLOTS);
    hideBackground = getSetting(SETTINGS.HIDE_BACKGROUND);
    hideLeftControls = getSetting(SETTINGS.HIDE_LEFT_CONTROLS);
    hideRightControls = getSetting(SETTINGS.HIDE_RIGHT_CONTROLS);
    hideSidebar = getSetting(SETTINGS.HIDE_SIDEBAR);
    hideSceneControls = getSetting(SETTINGS.HIDE_SCENE_CONTROLS);
    hideEntireHotbar = getSetting(SETTINGS.HIDE_ENTIRE_HOTBAR);
    hideChat = getSetting(SETTINGS.HIDE_CHAT);
    hidePlayers = getSetting(SETTINGS.HIDE_PLAYERS);
    hideSceneNavigation = getSetting(SETTINGS.HIDE_SCENE_NAVIGATION);
    hiddenPages = getSetting(SETTINGS.HIDDEN_PAGES);
    hiddenSidebarTabs = getSetting(SETTINGS.HIDDEN_SIDEBAR_TABS) || [];
  }
  
  const applyToGM = getSetting(SETTINGS.APPLY_TO_GM);
  const hideMacroDirectory = getSetting(SETTINGS.HIDE_MACRO_DIRECTORY);
  const opacity = getSetting(SETTINGS.OPACITY);
  const animationDuration = getSetting(SETTINGS.ANIMATION_DURATION);
  const effectiveHiddenSidebarTabs = new Set(hiddenSidebarTabs);

  if (hideMacroDirectory) {
    effectiveHiddenSidebarTabs.add("macros");
  }

  log(`Updating styles. GM: ${isGM}, ApplyToGM: ${applyToGM}, Using per-player: ${!!playerSettings}, Scene Controls hidden: ${hideSceneControls}, Entire Hotbar hidden: ${hideEntireHotbar}, Chat hidden: ${hideChat}, Players hidden: ${hidePlayers}`);

  let css = `
    /* Animation transitions */
    #hotbar .macro,
    #hotbar li[data-slot],
    #hotbar .bar-controls {
      transition: opacity ${animationDuration}ms ease-in-out,
                  transform ${animationDuration}ms ease-in-out,
                  visibility ${animationDuration}ms ease-in-out !important;
    }
  `;

  // Hide entire hotbar if enabled (applies to everyone or only non-GM)
  if (hideEntireHotbar && (!isGM || applyToGM)) {
    css += `
      #hotbar {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        transform: translateY(20px) !important;
        transition: opacity ${animationDuration}ms ease-in-out, transform ${animationDuration}ms ease-in-out, visibility ${animationDuration}ms ease-in-out !important;
      }
    `;
  }

  if (hideBackground) {
    css += `
      /* Remove hotbar background */
      #hotbar,
      #hotbar .macro-container,
      #hotbar .macros {
        background: none !important;
        box-shadow: none !important;
        border: none !important;
        background-color: transparent !important;
      }
    `;
  }

  // Apply slot/page hiding and opacity (only for non-GM or if applyToGM is true)
  if (!isGM || applyToGM) {
    // Hide individual slots
    for (const [slot, hidden] of Object.entries(hiddenSlots)) {
      if (hidden) {
        css += `
          #hotbar .macro[data-slot="${slot}"],
          #hotbar li[data-slot="${slot}"] {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            transform: scale(0.8) !important;
          }
        `;
      }
    }

    // Hide entire pages
    hiddenPages.forEach(page => {
      const slots = getSlotsForPage(page);
      slots.forEach(slot => {
        css += `
          #hotbar .macro[data-slot="${slot}"],
          #hotbar li[data-slot="${slot}"] {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            transform: scale(0.8) !important;
          }
        `;
      });
    });

    // Apply opacity to visible slots
    if (opacity < 100) {
      css += `
        #hotbar .macro:not([style*="opacity: 0"]),
        #hotbar li[data-slot]:not([style*="opacity: 0"]) {
          opacity: ${opacity / 100} !important;
        }
      `;
    }

    // Hide left controls
    if (hideLeftControls) {
      css += `
        #hotbar-directory-controls,
        #hotbar .bar-controls:first-child,
        #hotbar .bar-controls.directory-controls {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transform: translateX(-20px) !important;
        }
      `;
    } else {
      css += `
        #hotbar-directory-controls,
        #hotbar .bar-controls:first-child,
        #hotbar .bar-controls.directory-controls {
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: all !important;
          transform: translateX(0) !important;
        }
      `;
    }

    // Hide Sidebar (Right Tabs)
    if (hideSidebar) {
      css += `
        #sidebar {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transform: translateX(20px) !important;
          transition: opacity ${animationDuration}ms ease-in-out, transform ${animationDuration}ms ease-in-out, visibility ${animationDuration}ms ease-in-out !important;
        }
      `;
    } else {
      // Ensure sidebar is visible if not hidden
      css += `
        #sidebar {
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: all !important;
          transform: translateX(0) !important;
        }
      `;
      
      if (effectiveHiddenSidebarTabs.size > 0) {
        // Hide individual sidebar tabs
        effectiveHiddenSidebarTabs.forEach(tab => {
          css += `
            #sidebar-tabs [data-tab="${tab}"],
            #sidebar-tabs .item[data-tab="${tab}"],
            #sidebar-tabs a[data-tab="${tab}"],
            #sidebar .sidebar-tab[data-tab="${tab}"],
            .tabs .item[data-tab="${tab}"] {
              display: none !important;
            }
          `;
        });
      }
    }

    // Hide right controls
    if (hideRightControls) {
      css += `
        #hotbar-page-controls,
        #hotbar .bar-controls:last-child,
        #hotbar .bar-controls.page-controls {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transform: translateX(20px) !important;
        }
      `;
    } else {
      css += `
        #hotbar-page-controls,
        #hotbar .bar-controls:last-child,
        #hotbar .bar-controls.page-controls {
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: all !important;
          transform: translateX(0) !important;
        }
      `;
    }
  }

  // Hide Chat Box (only for non-GM, unless applyToGM is set - same gate as the other UI toggles)
  if (!isGM || applyToGM) {
    if (hideChat) {
      css += `
        #chat,
        #chat-log,
        #chat-form,
        #chat-controls,
        #chat-message,
        .sidebar-tab[data-tab="chat"],
        #sidebar #chat {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transform: translateX(20px) !important;
          transition: opacity ${animationDuration}ms ease-in-out, transform ${animationDuration}ms ease-in-out, visibility ${animationDuration}ms ease-in-out !important;
        }
      `;
    } else {
      // Ensure chat is visible if not hidden
      css += `
        #chat,
        #chat-log,
        #chat-form,
        #chat-controls,
        #chat-message,
        .sidebar-tab[data-tab="chat"],
        #sidebar #chat {
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: all !important;
          transform: translateX(0) !important;
        }
      `;
    }

    // Hide Player List
    if (hidePlayers) {
      css += `
        #players,
        #player-list,
        .player-list {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transform: translateY(-20px) !important;
          transition: opacity ${animationDuration}ms ease-in-out, transform ${animationDuration}ms ease-in-out, visibility ${animationDuration}ms ease-in-out !important;
        }
      `;
    }

    // Hide Scene Navigation
    if (hideSceneNavigation) {
      css += `
        #navigation,
        #nav,
        .scene-navigation,
        nav#scene-navigation {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transform: translateY(-20px) !important;
          transition: opacity ${animationDuration}ms ease-in-out, transform ${animationDuration}ms ease-in-out, visibility ${animationDuration}ms ease-in-out !important;
        }
      `;
    } else {
      // Ensure scene navigation is visible if not hidden
      css += `
        #navigation,
        #nav,
        .scene-navigation,
        nav#scene-navigation {
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: all !important;
          transform: translateY(0) !important;
        }
      `;
    }

    // Hide Scene Controls (Left Tools)
    if (hideSceneControls) {
      css += `
        #controls,
        .scene-control,
        ol#controls,
        #controls > *,
        .control-tools,
        div#controls,
        #controls-list,
        .controls-list,
        #ui-left #controls,
        #ui-left,
        .control-tools-list,
        #controls li,
        #controls .scene-control,
        .scene-controls,
        #scene-controls {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transform: translateX(-20px) !important;
          transition: opacity ${animationDuration}ms ease-in-out, transform ${animationDuration}ms ease-in-out, visibility ${animationDuration}ms ease-in-out !important;
          display: none !important;
        }
      `;
    }
  }

  if (effectiveHiddenSidebarTabs.size > 0) {
    log(`Generated CSS for tabs: ${Array.from(effectiveHiddenSidebarTabs).join(", ")}`);
  }

  updateStyleElement(css);
}
