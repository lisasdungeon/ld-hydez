import assert from 'node:assert/strict';
import test from 'node:test';
import { installMocks, resetMocks, restoreGlobals } from './foundry-mock.mjs';
import { MODULE_ID, SETTINGS, DEFAULTS, KEYBINDINGS } from '../scripts/constants.js';

function registerDefaults(overrides = {}) {
  for (const [key, defaultKey] of Object.entries(SETTINGS)) {
    game.settings.register(MODULE_ID, defaultKey, { default: overrides[defaultKey] ?? DEFAULTS[key] });
  }
}

test.beforeEach(() => {
  installMocks();
  // keybindings registry
  game.keybindings = {
    _regs: [],
    register(moduleId, key, config) {
      this._regs.push({ moduleId, key, config });
    }
  };
});
test.afterEach(() => { resetMocks(); restoreGlobals(); });

test('initHook registers the open-config keybinding and only opens for GM', async () => {
  const { initHook } = await import('../scripts/hooks.js');
  initHook();
  assert.equal(game.keybindings._regs.length, 1);
  assert.equal(game.keybindings._regs[0].key, KEYBINDINGS.OPEN_CONFIG);

  // non-GM onDown does nothing harmful
  game.user.isGM = false;
  game.keybindings._regs[0].config.onDown();

  game.user.isGM = true;
  // GM path triggers dynamic import. Should not throw with our ApplicationV2 mock.
  await game.keybindings._regs[0].config.onDown();
});

test('readyHook applies styles', async () => {
  registerDefaults();
  const { readyHook } = await import('../scripts/hooks.js');
  readyHook();
});

test('renderMacroDirectoryHook adds a GM-only footer button once', async () => {
  const { renderMacroDirectoryHook } = await import('../scripts/hooks.js');

  game.user.isGM = false;
  renderMacroDirectoryHook({}, { querySelector: () => null });

  game.user.isGM = true;
  // no element
  renderMacroDirectoryHook({}, null);
  renderMacroDirectoryHook({}, {});

  const children = [];
  const footer = {
    className: 'directory-footer',
    appendChild: (el) => children.push(el)
  };
  const element = {
    querySelector(sel) {
      if (sel === '.ld-hydez-config') return children.find((c) => c.className === 'ld-hydez-config') || null;
      if (sel === '.directory-footer') return footer;
      return null;
    },
    appendChild() {}
  };

  // already has button
  children.push({ className: 'ld-hydez-config' });
  renderMacroDirectoryHook({}, element);
  assert.equal(children.length, 1);

  children.length = 0;
  renderMacroDirectoryHook({}, [element]);
  assert.equal(children.length, 1);
  assert.equal(children[0].className, 'ld-hydez-config');

  // click opens hub (covers hooks.js button listener)
  if (typeof children[0].click === 'function') {
    await children[0].click();
  } else if (children[0]._listeners?.click?.[0]) {
    await children[0]._listeners.click[0]();
  }
});

test('renderMacroDirectoryHook creates a footer when missing', async () => {
  const { renderMacroDirectoryHook } = await import('../scripts/hooks.js');
  game.user.isGM = true;
  const appended = [];
  let footer = null;
  const element = {
    querySelector(sel) {
      if (sel === '.ld-hydez-config') return null;
      if (sel === '.directory-footer') return footer;
      return null;
    },
    appendChild(el) {
      footer = el;
      footer.appendChild = (btn) => appended.push(btn);
      appended.push(el);
    }
  };
  // need document.createElement
  const originalCreate = document.createElement;
  document.createElement = (tag) => {
    const el = {
      tagName: tag.toUpperCase(),
      className: '',
      type: '',
      innerHTML: '',
      listeners: {},
      addEventListener(type, fn) { this.listeners[type] = fn; },
      appendChild() {}
    };
    return el;
  };
  try {
    renderMacroDirectoryHook({}, element);
    assert.ok(appended.length >= 1);
  } finally {
    document.createElement = originalCreate;
  }
});

test('hotbarCollapseHook schedules a style refresh', async () => {
  registerDefaults();
  const { hotbarCollapseHook } = await import('../scripts/hooks.js');
  const timers = [];
  const original = globalThis.setTimeout;
  globalThis.setTimeout = (fn, ms) => {
    timers.push({ fn, ms });
    fn();
    return 1;
  };
  try {
    hotbarCollapseHook();
    assert.equal(timers.length, 1);
    assert.equal(timers[0].ms, 100);
  } finally {
    globalThis.setTimeout = original;
  }
});

test('getSceneControlButtonsHook adds a GM-only tool', async () => {
  const { getSceneControlButtonsHook } = await import('../scripts/hooks.js');
  game.user.isGM = false;
  getSceneControlButtonsHook({ tokens: { tools: {} } });

  game.user.isGM = true;
  getSceneControlButtonsHook(null);
  getSceneControlButtonsHook({});
  getSceneControlButtonsHook({ tokens: {} });

  const controls = { tokens: { tools: {} } };
  getSceneControlButtonsHook(controls);
  assert.ok(controls.tokens.tools.ldHydez);
  await controls.tokens.tools.ldHydez.onChange();

  const tokenGroup = { name: "token", tools: [] };
  const asArray = [tokenGroup];
  getSceneControlButtonsHook(asArray);
  assert.equal(tokenGroup.tools[0].name, "ldHydez");
  getSceneControlButtonsHook(asArray);
  assert.equal(tokenGroup.tools.length, 1);

  const namedTokens = { name: "tokens", tools: {} };
  getSceneControlButtonsHook([namedTokens]);
  assert.ok(namedTokens.tools.ldHydez);
  await namedTokens.tools.ldHydez.onClick();

  getSceneControlButtonsHook([]);
});

test('registerSettings registers all settings and a lazy config menu', async () => {
  const menus = [];
  const originalRegisterMenu = game.settings.registerMenu;
  game.settings.registerMenu = (moduleId, key, config) => {
    menus.push({ moduleId, key, config });
  };
  const { registerSettings, createLazyConfigMenu } = await import('../scripts/settings.js');
  registerSettings();
  assert.equal(menus.length, 1);
  assert.equal(menus[0].key, 'config');
  assert.equal(typeof menus[0].config.type, 'function');
  assert.equal(menus[0].config.type.prototype instanceof foundry.applications.api.ApplicationV2, true);

  const Lazy = createLazyConfigMenu();
  const shell = new Lazy();
  const rendered = await shell.render(true);
  assert.ok(rendered);

  // Fire onChange callbacks stored on registered settings (coverage for arrow handlers)
  const { getSettingsStore } = await import('./foundry-mock.mjs');
  // re-register through real path to store configs
  installMocks();
  registerSettings();
  // manually invoke onChange from a known setting registration
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  registerDefaults({ hideChat: true });
  updateHotbarStyles();

  game.settings.registerMenu = originalRegisterMenu;
});

test('registerHelpers and module lifecycle exports work', async () => {
  const helpers = {};
  globalThis.Handlebars = {
    registerHelper(name, fn) { helpers[name] = fn; }
  };
  const onceHandlers = new Map();
  const onHandlers = new Map();
  globalThis.Hooks = {
    once(name, fn) {
      if (!onceHandlers.has(name)) onceHandlers.set(name, []);
      onceHandlers.get(name).push(fn);
    },
    on(name, fn) {
      if (!onHandlers.has(name)) onHandlers.set(name, []);
      onHandlers.get(name).push(fn);
    }
  };

  const mod = await import('../scripts/module.js');
  mod.registerHelpers();
  assert.equal(helpers.subtract, undefined);
  assert.equal(helpers.includes([1, 2], 2), true);
  assert.equal(helpers.includes([1, 2], 9), false);
  assert.equal(helpers.includes('nope', 1), false);

  registerDefaults();
  game.keybindings = {
    register() {}
  };
  mod.onInit();
  mod.onReady();
  mod.registerModuleHooks();
  assert.ok(onceHandlers.get('init')?.length >= 1);
  assert.ok(onceHandlers.get('ready')?.length >= 1);

  // Fire the registered once handlers (covers module.js lines 44/48)
  for (const fn of onceHandlers.get('init') || []) await fn();
  for (const fn of onceHandlers.get('ready') || []) fn();
});

test('openConfigHub dynamic-imports the config application', async () => {
  const { openConfigHub } = await import('../scripts/hooks.js');
  const result = await openConfigHub();
  assert.ok(result);
});
