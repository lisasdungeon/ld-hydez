import assert from 'node:assert/strict';
import test from 'node:test';
import { installMocks, resetMocks, restoreGlobals, getElementRegistry } from './foundry-mock.mjs';
import { MODULE_ID, SETTINGS, DEFAULTS, CSS_IDS } from '../scripts/constants.js';

function registerDefaults(overrides = {}) {
  for (const [key, defaultKey] of Object.entries(SETTINGS)) {
    game.settings.register(MODULE_ID, defaultKey, { default: overrides[defaultKey] ?? DEFAULTS[key] });
  }
}

function getCss() {
  return getElementRegistry().get(CSS_IDS.STYLE_ELEMENT).textContent;
}

test.beforeEach(() => installMocks());
test.afterEach(() => { resetMocks(); restoreGlobals(); });

test('updateHotbarStyles hides nothing and leaves chat/players visible with all defaults', async () => {
  registerDefaults();
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  updateHotbarStyles();
  const css = getCss();
  assert.ok(!css.includes('#hotbar {'));
  assert.match(css, /#chat,[\s\S]*visibility: visible/);
  assert.ok(!css.includes('#players,'));
});

test('hideEntireHotbar hides the hotbar for a player', async () => {
  registerDefaults({ hideEntireHotbar: true });
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  installMocks({ user: { id: 'p1', isGM: false } });
  registerDefaults({ hideEntireHotbar: true });
  updateHotbarStyles();
  assert.match(getCss(), /#hotbar\s*\{[\s\S]*visibility: hidden/);
});

test('hideEntireHotbar does not affect the GM unless applyToGM is set', async () => {
  installMocks({ user: { id: 'gm1', isGM: true } });
  registerDefaults({ hideEntireHotbar: true, applyToGM: false });
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  updateHotbarStyles();
  assert.ok(!getCss().includes('#hotbar {'));
});

test('hideEntireHotbar affects the GM when applyToGM is true', async () => {
  installMocks({ user: { id: 'gm1', isGM: true } });
  registerDefaults({ hideEntireHotbar: true, applyToGM: true });
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  updateHotbarStyles();
  assert.match(getCss(), /#hotbar\s*\{[\s\S]*visibility: hidden/);
});

test('hiddenSlots generates a selector per hidden slot', async () => {
  installMocks({ user: { id: 'p1', isGM: false } });
  registerDefaults({ hiddenSlots: { 3: true, 7: false, 12: true } });
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  updateHotbarStyles();
  const css = getCss();
  assert.match(css, /data-slot="3"/);
  assert.match(css, /data-slot="12"/);
  assert.ok(!css.includes('data-slot="7"'));
});

test('hiddenPages hides every slot on that page', async () => {
  installMocks({ user: { id: 'p1', isGM: false } });
  registerDefaults({ hiddenPages: [2] });
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  updateHotbarStyles();
  const css = getCss();
  for (let slot = 11; slot <= 20; slot++) {
    assert.match(css, new RegExp(`data-slot="${slot}"`), `slot ${slot} should be hidden`);
  }
  assert.ok(!css.includes('data-slot="10"'));
  assert.ok(!css.includes('data-slot="21"'));
});

test('hideMacroDirectory forces the macros sidebar tab into the hidden set', async () => {
  installMocks({ user: { id: 'p1', isGM: false } });
  registerDefaults({ hideMacroDirectory: true });
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  updateHotbarStyles();
  assert.match(getCss(), /data-tab="macros"/);
});

test('hiddenSidebarTabs generates a selector per tab', async () => {
  installMocks({ user: { id: 'p1', isGM: false } });
  registerDefaults({ hiddenSidebarTabs: ['chat', 'journal'] });
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  updateHotbarStyles();
  const css = getCss();
  assert.match(css, /data-tab="chat"/);
  assert.match(css, /data-tab="journal"/);
  assert.ok(!css.includes('data-tab="combat"'));
});

test('per-player settings override global settings for a non-GM player with an entry', async () => {
  installMocks({ user: { id: 'p1', isGM: false } });
  registerDefaults({
    hideChat: false,
    perPlayerSettings: { p1: { hideChat: true, hiddenSlots: {}, hiddenPages: [], hiddenSidebarTabs: [] } }
  });
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  updateHotbarStyles();
  assert.match(getCss(), /#chat,[\s\S]*visibility: hidden/);
});

test('per-player settings are ignored for the GM even if present', async () => {
  installMocks({ user: { id: 'gm1', isGM: true } });
  registerDefaults({
    hideChat: false,
    perPlayerSettings: { gm1: { hideChat: true, hiddenSlots: {}, hiddenPages: [], hiddenSidebarTabs: [] } }
  });
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  updateHotbarStyles();
  assert.match(getCss(), /#chat,[\s\S]*visibility: visible/);
});

test('opacity below 100 applies a scaled opacity rule to visible slots', async () => {
  installMocks({ user: { id: 'p1', isGM: false } });
  registerDefaults({ slotOpacity: 50 });
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  updateHotbarStyles();
  assert.match(getCss(), /opacity: 0\.5 !important/);
});

test('hideChat and hidePlayers apply regardless of GM status', async () => {
  installMocks({ user: { id: 'gm1', isGM: true } });
  registerDefaults({ hideChat: true, hidePlayers: true, applyToGM: false });
  const { updateHotbarStyles } = await import('../scripts/styles.js');
  updateHotbarStyles();
  const css = getCss();
  assert.match(css, /#chat,[\s\S]*visibility: hidden/);
  assert.match(css, /#players,[\s\S]*visibility: hidden/);
});
