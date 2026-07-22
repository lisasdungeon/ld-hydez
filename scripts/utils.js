/**
 * Copyright © 2025 Lisa's Dungeon / LD
 * All Rights Reserved
 */

import { MODULE_ID, CSS_IDS } from "./constants.js";

function i18n(key, data = {}) {
  const localized = game.i18n?.localize?.(key);
  if (!localized || localized === key) return key;
  return foundry.utils.formatString(localized, data);
}

/**
 * Get a setting value
 * @param {string} key - Setting key
 * @returns {*} Setting value
 */
export function getSetting(key) {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch (error) {
    ui.notifications.error(`${game.i18n.localize("LDH.Title")}: Failed to get setting "${key}"`);
    return null;
  }
}

/**
 * Set a setting value
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 */
export async function setSetting(key, value) {
  try {
    await game.settings.set(MODULE_ID, key, value);
  } catch (error) {
    ui.notifications.error(`${game.i18n.localize("LDH.Title")}: Failed to set setting "${key}"`);
    throw error;
  }
}

/**
 * Validate slot number
 * @param {number} slot - Slot number to validate
 * @returns {boolean} Whether slot is valid
 */
export function isValidSlot(slot) {
  return Number.isInteger(slot) && slot >= 1 && slot <= 50;
}

/**
 * Validate page number
 * @param {number} page - Page number to validate
 * @returns {boolean} Whether page is valid
 */
export function isValidPage(page) {
  return Number.isInteger(page) && page >= 1 && page <= 5;
}

/**
 * Get all slots for a specific page
 * @param {number} page - Page number (1-5)
 * @returns {number[]} Array of slot numbers
 */
export function getSlotsForPage(page) {
  if (!isValidPage(page)) return [];
  const start = (page - 1) * 10 + 1;
  return Array.from({ length: 10 }, (_, i) => start + i);
}

/**
 * Apply or remove a CSS class from an element
 * @param {HTMLElement} element - Target element
 * @param {string} className - CSS class name
 * @param {boolean} apply - Whether to add or remove
 */
export function toggleClass(element, className, apply) {
  if (!element) return;
  if (apply) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

/**
 * Create or update the dynamic style element
 * @param {string} css - CSS content
 */
export function updateStyleElement(css) {
  let styleElement = document.getElementById(CSS_IDS.STYLE_ELEMENT);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = CSS_IDS.STYLE_ELEMENT;
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = css;
}

/**
 * Log module message
 * @param {string} message - Message to log
 * @param {string} level - Log level (log, warn, error)
 */
export function log(message, level = "log") {
  console[level](`${MODULE_ID} | ${message}`);
}

/**
 * Show notification to user
 * @param {string} message - Message to show
 * @param {string} type - Notification type (info, warning, error)
 */
export function notify(message, type = "info") {
  ui.notifications[type](message);
}

export function localize(key, data = {}) {
  return i18n(key, data);
}
