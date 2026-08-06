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
