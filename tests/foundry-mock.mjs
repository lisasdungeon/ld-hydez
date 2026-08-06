let originalGlobals;
let settingsStore = new Map();
let elementRegistry = new Map();

/** Stable DialogV2 so modules that capture the class at import time keep working. */
export class MockDialogV2 {
  static inputResult = null;
  static confirmResult = false;
  static async input() {
    return MockDialogV2.inputResult;
  }
  static async confirm() {
    return MockDialogV2.confirmResult;
  }
}

function createStyleElement(id) {
  const elem = {
    id,
    tagName: "STYLE",
    _textContent: "",
    get textContent() { return elem._textContent; },
    set textContent(value) { elem._textContent = value; },
    remove() { elementRegistry.delete(id); }
  };
  return elem;
}

const doc = {
  getElementById(id) { return elementRegistry.get(id) || null; },
  createElement(tag) {
    if (tag === "style") {
      const elem = createStyleElement(undefined);
      const target = new Proxy(elem, {
        set(obj, prop, value) {
          obj[prop] = value;
          if (prop === "id" && value) elementRegistry.set(value, target);
          return true;
        }
      });
      return target;
    }
    const listeners = {};
    return {
      tagName: String(tag).toUpperCase(),
      className: "",
      type: "",
      innerHTML: "",
      style: {},
      addEventListener(type, fn) {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      click() {
        for (const fn of listeners.click || []) fn({ type: "click" });
      },
      appendChild() {},
      _listeners: listeners
    };
  },
  head: {
    appendChild(elem) {
      if (elem?.id) elementRegistry.set(elem.id, elem);
      return elem;
    }
  }
};

function makeSettings() {
  return {
    register(moduleId, key, config) {
      const storeKey = `${moduleId}.${key}`;
      if (!settingsStore.has(storeKey)) settingsStore.set(storeKey, config.default);
      settingsStore.set(`${storeKey}__config`, config);
    },
    registerMenu(moduleId, key, config) {
      settingsStore.set(`${moduleId}.menu.${key}`, config);
    },
    get(moduleId, key) {
      const storeKey = `${moduleId}.${key}`;
      if (!settingsStore.has(storeKey)) throw new Error(`Setting not registered: ${storeKey}`);
      return settingsStore.get(storeKey);
    },
    async set(moduleId, key, value) {
      settingsStore.set(`${moduleId}.${key}`, value);
      return value;
    }
  };
}

export function installMocks(options = {}) {
  if (!originalGlobals) {
    originalGlobals = {
      game: globalThis.game,
      ui: globalThis.ui,
      document: globalThis.document,
      Handlebars: globalThis.Handlebars,
      CONST: globalThis.CONST,
      foundry: globalThis.foundry,
      Hooks: globalThis.Hooks,
      Blob: globalThis.Blob,
      URL: globalThis.URL
    };
  }
  resetMocks();
  MockDialogV2.inputResult = null;
  MockDialogV2.confirmResult = false;

  const game = {
    settings: makeSettings(),
    user: options.user ?? { id: "gm1", isGM: true },
    users: options.users ?? [{ id: "gm1", isGM: true, name: "GM", color: "#fff" }],
    i18n: { localize: (key) => key, format: (key, data) => key },
    keybindings: { register() {} }
  };
  const ui = { notifications: { info() {}, warn() {}, error() {} } };

  class ApplicationV2 {
    static DEFAULT_OPTIONS = {};
    element = { querySelector: () => null, querySelectorAll: () => [] };
    render() { return this; }
    close() { return this; }
    _prepareContext() { return {}; }
    _onRender() {}
  }
  const HandlebarsApplicationMixin = (Base) => class extends Base {};

  const foundry = {
    utils: { mergeObject: (a, b) => ({ ...a, ...b }), formatString: (str) => str },
    applications: {
      api: {
        ApplicationV2,
        HandlebarsApplicationMixin,
        DialogV2: MockDialogV2
      }
    }
  };

  globalThis.Hooks = globalThis.Hooks || {
    once() {},
    on() {}
  };
  globalThis.game = game;
  globalThis.ui = ui;
  globalThis.document = doc;
  globalThis.foundry = foundry;
  globalThis.CONST = { KEYBINDING_PRECEDENCE: { NORMAL: 0 } };
  globalThis.Handlebars = { registerHelper() {} };

  return { game, ui, document: doc, DialogV2: MockDialogV2 };
}

export function resetMocks() {
  settingsStore = new Map();
  elementRegistry = new Map();
}

export function restoreGlobals() {
  if (!originalGlobals) return;
  for (const [key, value] of Object.entries(originalGlobals)) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
}

export function getElementRegistry() {
  return elementRegistry;
}

export function getSettingsStore() {
  return settingsStore;
}
