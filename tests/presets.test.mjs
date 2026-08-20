import assert from 'node:assert/strict';
import test from 'node:test';
import { installMocks, resetMocks, restoreGlobals, MockDialogV2 } from './foundry-mock.mjs';
import { MODULE_ID, SETTINGS, DEFAULTS } from '../scripts/constants.js';

// Install mocks before first import so presets.js captures MockDialogV2.
installMocks();
const {
  loadPreset,
  savePreset,
  deletePreset,
  exportConfig,
  importConfig
} = await import('../scripts/presets.js');

function registerDefaults(overrides = {}) {
  for (const [key, defaultKey] of Object.entries(SETTINGS)) {
    game.settings.register(MODULE_ID, defaultKey, { default: overrides[defaultKey] ?? DEFAULTS[key] });
  }
}

test.beforeEach(() => {
  installMocks();
  MockDialogV2.inputResult = null;
  MockDialogV2.confirmResult = false;
});
test.afterEach(() => { resetMocks(); restoreGlobals(); });

test('loadPreset applies preset config and re-renders the app', async () => {
  registerDefaults({
    presets: [{
      name: 'Cinema',
      config: {
        hiddenSlots: { 1: true },
        hideBackground: true,
        hideLeftControls: true,
        hideRightControls: false,
        opacity: 40,
        hiddenPages: [2]
      }
    }]
  });
  const app = { renderCalls: 0, render() { this.renderCalls += 1; } };

  await loadPreset.call(app, { target: { value: '0' } });
  assert.equal(game.settings.get(MODULE_ID, SETTINGS.OPACITY), 40);
  assert.equal(game.settings.get(MODULE_ID, SETTINGS.HIDE_BACKGROUND), true);
  assert.equal(game.settings.get(MODULE_ID, SETTINGS.ACTIVE_PRESET), 'Cinema');
  assert.equal(app.renderCalls, 1);

  await loadPreset.call(app, { target: { value: '99' } });
  assert.equal(app.renderCalls, 1);
});

test('savePreset pushes a new preset when DialogV2 returns a name', async () => {
  registerDefaults({
    hiddenSlots: { 3: true },
    hideBackground: true,
    hideLeftControls: false,
    hideRightControls: true,
    slotOpacity: 80,
    hiddenPages: [1]
  });
  MockDialogV2.inputResult = { 'preset-name': 'My Preset' };
  const app = { renderCalls: 0, render() { this.renderCalls += 1; } };

  await savePreset.call(app, null, null);
  const presets = game.settings.get(MODULE_ID, SETTINGS.PRESETS);
  assert.equal(presets.length, 1);
  assert.equal(presets[0].name, 'My Preset');
  assert.equal(presets[0].config.opacity, 80);
  assert.equal(app.renderCalls, 1);

  MockDialogV2.inputResult = { 'preset-name': '' };
  await savePreset.call(app, null, null);
  assert.equal(game.settings.get(MODULE_ID, SETTINGS.PRESETS).length, 1);

  MockDialogV2.inputResult = null;
  await savePreset.call(app, null, null);
  assert.equal(game.settings.get(MODULE_ID, SETTINGS.PRESETS).length, 1);
});

test('deletePreset removes the selected preset after confirmation', async () => {
  registerDefaults({
    presets: [
      { name: 'A', config: {} },
      { name: 'B', config: {} }
    ]
  });
  const app = {
    element: {
      querySelector: () => ({ value: '1' })
    },
    renderCalls: 0,
    render() { this.renderCalls += 1; }
  };

  MockDialogV2.confirmResult = false;
  await deletePreset.call(app, null, null);
  assert.equal(game.settings.get(MODULE_ID, SETTINGS.PRESETS).length, 2);

  MockDialogV2.confirmResult = true;
  await deletePreset.call(app, null, null);
  const remaining = game.settings.get(MODULE_ID, SETTINGS.PRESETS);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].name, 'A');
  assert.equal(app.renderCalls, 1);

  app.element.querySelector = () => ({ value: '-1' });
  await deletePreset.call(app, null, null);
  assert.equal(game.settings.get(MODULE_ID, SETTINGS.PRESETS).length, 1);

  app.element.querySelector = () => null;
  await deletePreset.call(app, null, null);
});

test('exportConfig creates a downloadable JSON blob', async () => {
  registerDefaults({ hideChat: true, slotOpacity: 70 });
  const clicks = [];
  const revoked = [];
  const originalCreate = document.createElement;
  const originalURL = globalThis.URL;
  globalThis.URL = {
    createObjectURL: () => 'blob:test',
    revokeObjectURL: (u) => revoked.push(u)
  };
  globalThis.Blob = class Blob {
    constructor(parts, opts) {
      this.parts = parts;
      this.opts = opts;
    }
  };
  document.createElement = (tag) => {
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        click: () => clicks.push(true)
      };
    }
    return originalCreate.call(document, tag);
  };

  try {
    await exportConfig.call({}, null, null);
    assert.equal(clicks.length, 1);
    assert.equal(revoked.length, 1);
  } finally {
    document.createElement = originalCreate;
    globalThis.URL = originalURL;
  }
});

test('importConfig sanitizes and applies a JSON file; reports parse errors', async () => {
  installMocks({
    users: [
      { id: 'gm1', isGM: true, name: 'GM' },
      { id: 'p1', isGM: false, name: 'Player1' }
    ]
  });
  registerDefaults();
  const app = { renderCalls: 0, render() { this.renderCalls += 1; } };

  let changeHandler;
  const originalCreate = document.createElement.bind(document);
  document.createElement = (tag) => {
    if (tag === 'input') {
      return {
        type: '',
        accept: '',
        set onchange(fn) { changeHandler = fn; },
        get onchange() { return changeHandler; },
        click() {
          changeHandler({
            target: {
              files: [{
                text: async () => JSON.stringify({
                  hiddenSlots: { 1: true, 999: true },
                  hideBackground: true,
                  applyToGM: true,
                  hideLeftControls: true,
                  hideRightControls: true,
                  hideSidebar: true,
                  hideSceneControls: true,
                  hideEntireHotbar: true,
                  hideChat: true,
                  hidePlayers: true,
                  hideSceneNavigation: true,
                  hideMacroDirectory: true,
                  opacity: 150,
                  animationDuration: 5000,
                  hiddenPages: [1, 9],
                  hiddenSidebarTabs: ['chat', 'bogus'],
                  presets: [
                    { name: 'P', config: { hiddenSlots: { 2: true }, opacity: -5, hiddenPages: [2] } },
                    { name: 1, config: {} },
                    null
                  ],
                  perPlayerSettings: {
                    p1: { hideChat: true, hiddenSlots: { 1: true }, hiddenPages: [1], hiddenSidebarTabs: ['chat'] },
                    unknown: { hideChat: true }
                  }
                })
              }]
            }
          });
        }
      };
    }
    return originalCreate(tag);
  };

  try {
    await importConfig.call(app, null, null);
    // onchange is async. Wait a tick for the handler to finish.
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(game.settings.get(MODULE_ID, SETTINGS.HIDE_BACKGROUND), true);
    assert.equal(game.settings.get(MODULE_ID, SETTINGS.OPACITY), 100);
    assert.equal(game.settings.get(MODULE_ID, SETTINGS.ANIMATION_DURATION), 1000);
    assert.deepEqual(game.settings.get(MODULE_ID, SETTINGS.HIDDEN_PAGES), [1]);
    assert.deepEqual(game.settings.get(MODULE_ID, SETTINGS.HIDDEN_SIDEBAR_TABS), ['chat']);
    assert.equal(game.settings.get(MODULE_ID, SETTINGS.PRESETS).length, 1);
    assert.equal(game.settings.get(MODULE_ID, SETTINGS.PRESETS)[0].config.opacity, 0);
    assert.equal(app.renderCalls, 1);

    // no file selected
    document.createElement = (tag) => {
      if (tag === 'input') {
        return {
          type: '',
          accept: '',
          set onchange(fn) { changeHandler = fn; },
          click() {
            changeHandler({ target: { files: [] } });
          }
        };
      }
      return originalCreate(tag);
    };
    await importConfig.call(app, null, null);

    // invalid JSON
    document.createElement = (tag) => {
      if (tag === 'input') {
        return {
          type: '',
          accept: '',
          set onchange(fn) { changeHandler = fn; },
          click() {
            changeHandler({
              target: {
                files: [{ text: async () => 'not-json' }]
              }
            });
          }
        };
      }
      return originalCreate(tag);
    };
    await importConfig.call(app, null, null);
    await new Promise((r) => setTimeout(r, 20));
  } finally {
    document.createElement = originalCreate;
  }
});
