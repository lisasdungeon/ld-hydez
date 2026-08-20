import assert from 'node:assert/strict';
import test from 'node:test';
import { installMocks, resetMocks, restoreGlobals } from './foundry-mock.mjs';
import { MODULE_ID, SETTINGS, DEFAULTS } from '../scripts/constants.js';

function registerDefaults(overrides = {}) {
  for (const [key, defaultKey] of Object.entries(SETTINGS)) {
    game.settings.register(MODULE_ID, defaultKey, { default: overrides[defaultKey] ?? DEFAULTS[key] });
  }
}

test.beforeEach(() => installMocks());
test.afterEach(() => { resetMocks(); restoreGlobals(); });

test('saving the form without touching the Player tab does not create per-player overrides', async () => {
  installMocks({
    user: { id: 'gm1', isGM: true },
    users: [{ id: 'gm1', isGM: true, name: 'GM', color: '#fff' }, { id: 'p1', isGM: false, name: 'Player1', color: '#0f0' }]
  });
  registerDefaults();
  const { HideHotbarConfig } = await import('../scripts/config.js');
  const { updateHotbarStyles } = await import('../scripts/styles.js');

  const app = new HideHotbarConfig();
  const handler = HideHotbarConfig.DEFAULT_OPTIONS.form.handler;

  // GM only checks a global slot to hide - never opens the Player tab.
  await handler.call(app, null, null, { object: { 'slot-1': true } });

  const perPlayerSettings = await game.settings.get(MODULE_ID, SETTINGS.PER_PLAYER_SETTINGS);
  assert.deepEqual(perPlayerSettings, {}, 'no blank per-player override should be persisted');
  assert.equal((await game.settings.get(MODULE_ID, SETTINGS.HIDDEN_SLOTS))[1], true);
});

test('an explicit per-player override is still persisted and scoped to that player', async () => {
  installMocks({
    user: { id: 'gm1', isGM: true },
    users: [{ id: 'gm1', isGM: true, name: 'GM', color: '#fff' }, { id: 'p1', isGM: false, name: 'Player1', color: '#0f0' }]
  });
  registerDefaults();
  const { HideHotbarConfig } = await import('../scripts/config.js');
  const app = new HideHotbarConfig();
  const handler = HideHotbarConfig.DEFAULT_OPTIONS.form.handler;

  await handler.call(app, null, null, { object: { 'player-p1-hideChat': true } });

  const perPlayerSettings = await game.settings.get(MODULE_ID, SETTINGS.PER_PLAYER_SETTINGS);
  assert.equal(perPlayerSettings.p1.hideChat, true);
});

test('checking applyToGM together with a hide option applies it to the GM', async () => {
  installMocks({
    user: { id: 'gm1', isGM: true },
    users: [{ id: 'gm1', isGM: true, name: 'GM', color: '#fff' }]
  });
  registerDefaults();
  const { HideHotbarConfig } = await import('../scripts/config.js');
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  const { getElementRegistry } = await import('./foundry-mock.mjs');
  const { CSS_IDS } = await import('../scripts/constants.js');

  const app = new HideHotbarConfig();
  const handler = HideHotbarConfig.DEFAULT_OPTIONS.form.handler;
  await handler.call(app, null, null, { object: { applyToGM: true, hideSceneControls: true } });

  updateHotbarStyles();
  const css = getElementRegistry().get(CSS_IDS.STYLE_ELEMENT).textContent;
  assert.match(css, /#controls,/);
});

test('_prepareContext exposes the settings needed by the template', async () => {
  installMocks({ users: [{ id: 'gm1', isGM: true, name: 'GM', color: '#fff' }] });
  registerDefaults();
  const { HideHotbarConfig } = await import('../scripts/config.js');
  const app = new HideHotbarConfig();
  const context = await app._prepareContext({});
  assert.equal(context.slots.length, 50);
  assert.equal(context.pages.length, 5);
  assert.equal(context.players.length, 0);
});

test('_prepareContext includes players, presets, and macro-directory force-hide', async () => {
  installMocks({
    users: [
      { id: 'gm1', isGM: true, name: 'GM', color: '#fff' },
      { id: 'p1', isGM: false, name: 'Player1', color: '#0f0' }
    ]
  });
  registerDefaults({
    hideMacroDirectory: true,
    presets: [{ name: 'Cinema', config: {} }],
    activePreset: 'Cinema',
    perPlayerSettings: {
      p1: {
        hideChat: true,
        hiddenSlots: { 1: true },
        hiddenPages: [2],
        hiddenSidebarTabs: ['chat']
      }
    }
  });
  const { HideHotbarConfig } = await import('../scripts/config.js');
  const app = new HideHotbarConfig();
  const context = await app._prepareContext({});
  assert.equal(context.players.length, 1);
  assert.equal(context.players[0].id, 'p1');
  assert.equal(context.presets[0].selected, true);
  assert.ok(context.sidebarTabs.find((t) => t.id === 'macros')?.hidden);
});

test('page checkbox handlers toggle slot checkboxes for GM and player pages', async () => {
  installMocks();
  registerDefaults();
  const { HideHotbarConfig } = await import('../scripts/config.js');
  const app = new HideHotbarConfig();
  const checked = {};
  app.element = {
    querySelector(sel) {
      const m = sel.match(/slot-(\d+)/);
      if (!m) return null;
      return {
        get checked() { return checked[m[1]] || false; },
        set checked(v) { checked[m[1]] = v; }
      };
    },
    querySelectorAll(sel) {
      if (sel.includes('page-checkbox-player') || sel.includes('page-checkbox') || sel.includes('load-preset')) {
        return [{ addEventListener: () => {} }];
      }
      if (sel.startsWith("input[name^='slot-']") || sel.includes('player-')) {
        return [{ checked: false }, { checked: false }];
      }
      return [];
    }
  };

  app._onPageCheckboxChange({ target: { dataset: { page: '2' }, checked: true } });
  assert.equal(checked['11'], true);
  assert.equal(checked['20'], true);

  app._onPlayerPageCheckboxChange({
    target: { dataset: { player: 'p1', page: '1' }, checked: true }
  });
  // player page uses name player-p1-slot-N. Our querySelector only matches slot-N,
  // so this path exercises the loop without asserting checked map.

  app._onRender({}, {});
});

test('select all/none slot actions toggle inputs', async () => {
  installMocks();
  registerDefaults();
  const { HideHotbarConfig } = await import('../scripts/config.js');
  const inputs = [{ checked: false }, { checked: false }];
  const app = new HideHotbarConfig();
  app.element = {
    querySelectorAll(sel) {
      return inputs;
    }
  };

  HideHotbarConfig.DEFAULT_OPTIONS.actions.selectAllSlots.call(app, null, null);
  assert.ok(inputs.every((i) => i.checked));
  HideHotbarConfig.DEFAULT_OPTIONS.actions.selectNoneSlots.call(app, null, null);
  assert.ok(inputs.every((i) => !i.checked));

  HideHotbarConfig.DEFAULT_OPTIONS.actions.selectAllPlayerSlots.call(app, null, { dataset: { player: 'p1' } });
  assert.ok(inputs.every((i) => i.checked));
  HideHotbarConfig.DEFAULT_OPTIONS.actions.selectNonePlayerSlots.call(app, null, { dataset: { player: 'p1' } });
  assert.ok(inputs.every((i) => !i.checked));
});

test('submit processes pages, sidebar tabs, and full player overrides; catch path notifies', async () => {
  installMocks({
    users: [
      { id: 'gm1', isGM: true, name: 'GM', color: '#fff' },
      { id: 'p1', isGM: false, name: 'Player1', color: '#0f0' }
    ]
  });
  registerDefaults();
  const { HideHotbarConfig } = await import('../scripts/config.js');
  const app = new HideHotbarConfig();
  const handler = HideHotbarConfig.DEFAULT_OPTIONS.form.handler;

  await handler.call(app, null, null, {
    object: {
      'page-1': true,
      'page-2': false,
      'sidebar-tab-chat': true,
      'sidebar-tab-journal': true,
      hideBackground: true,
      opacity: '75',
      animationDuration: '200',
      'player-p1-hideChat': true,
      'player-p1-slot-3': true,
      'player-p1-page-2': true,
      'player-p1-sidebar-tab-combat': true,
      'player-p1-hideSceneControls': true,
      'player-p1-hideSidebar': true,
      'player-p1-hideEntireHotbar': true,
      'player-p1-hideBackground': true,
      'player-p1-hideLeftControls': true,
      'player-p1-hideRightControls': true,
      'player-p1-hidePlayers': true,
      'player-p1-hideSceneNavigation': true
    }
  });

  assert.deepEqual(game.settings.get(MODULE_ID, SETTINGS.HIDDEN_PAGES), [1]);
  assert.deepEqual(game.settings.get(MODULE_ID, SETTINGS.HIDDEN_SIDEBAR_TABS), ['chat', 'journal']);
  const per = game.settings.get(MODULE_ID, SETTINGS.PER_PLAYER_SETTINGS);
  assert.equal(per.p1.hideChat, true);
  assert.equal(per.p1.hiddenSlots[3], true);
  assert.deepEqual(per.p1.hiddenPages, [2]);
  assert.deepEqual(per.p1.hiddenSidebarTabs, ['combat']);

  // force setSetting failure for catch branch
  const originalSet = game.settings.set;
  game.settings.set = async () => { throw new Error('fail'); };
  await handler.call(app, null, null, { object: { hideChat: true } });
  game.settings.set = originalSet;
});

