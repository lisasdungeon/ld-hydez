let originalGlobals;
let settingsStore = new Map();
let elementRegistry = new Map();

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
      // id is assigned by the caller after creation; track once set.
      const target = new Proxy(elem, {
        set(obj, prop, value) {
          obj[prop] = value;
          if (prop === "id" && value) elementRegistry.set(value, target);
          return true;
        }
      });
      return target;
    }
    return { tagName: tag.toUpperCase() };
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
    },
    registerMenu() {},
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
      foundry: globalThis.foundry
    };
  }
  resetMocks();

  const game = {
    settings: makeSettings(),
    user: options.user ?? { id: "gm1", isGM: true },
    users: options.users ?? [{ id: "gm1", isGM: true, name: "GM", color: "#fff" }],
    i18n: { localize: (key) => key, format: (key) => key }
  };
  const ui = { notifications: { info() {}, warn() {}, error() {} } };
  const foundry = { utils: { mergeObject: (a, b) => ({ ...a, ...b }), formatString: (str) => str } };

  globalThis.game = game;
  globalThis.ui = ui;
  globalThis.document = doc;
  globalThis.foundry = foundry;
  globalThis.CONST = { KEYBINDING_PRECEDENCE: { NORMAL: 0 } };
  globalThis.Handlebars = { registerHelper() {} };

  return { game, ui, document: doc };
}

export function resetMocks() {
  settingsStore = new Map();
  elementRegistry = new Map();
}

export function restoreGlobals() {
  if (!originalGlobals) return;
  for (const [key, value] of Object.entries(originalGlobals)) globalThis[key] = value;
}

export function getElementRegistry() {
  return elementRegistry;
}
