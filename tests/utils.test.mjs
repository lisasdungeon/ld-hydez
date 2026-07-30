import assert from 'node:assert/strict';
import test from 'node:test';
import { installMocks, resetMocks, restoreGlobals } from './foundry-mock.mjs';

test.beforeEach(() => installMocks());
test.afterEach(() => { resetMocks(); restoreGlobals(); });

test('isValidSlot accepts 1-50 integers only', async () => {
  const { isValidSlot } = await import('../scripts/utils.js');
  assert.equal(isValidSlot(1), true);
  assert.equal(isValidSlot(50), true);
  assert.equal(isValidSlot(25), true);
  assert.equal(isValidSlot(0), false);
  assert.equal(isValidSlot(51), false);
  assert.equal(isValidSlot(-1), false);
  assert.equal(isValidSlot(1.5), false);
  assert.equal(isValidSlot(NaN), false);
  assert.equal(isValidSlot('1'), false);
});

test('isValidPage accepts 1-5 integers only', async () => {
  const { isValidPage } = await import('../scripts/utils.js');
  assert.equal(isValidPage(1), true);
  assert.equal(isValidPage(5), true);
  assert.equal(isValidPage(0), false);
  assert.equal(isValidPage(6), false);
  assert.equal(isValidPage(2.5), false);
});

test('getSlotsForPage returns the correct 10-slot range per page', async () => {
  const { getSlotsForPage } = await import('../scripts/utils.js');
  assert.deepEqual(getSlotsForPage(1), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(getSlotsForPage(2), [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  assert.deepEqual(getSlotsForPage(5), [41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
  assert.deepEqual(getSlotsForPage(6), []);
  assert.deepEqual(getSlotsForPage(0), []);
});

test('sanitizeHiddenSlots drops invalid keys and coerces booleans', async () => {
  const { sanitizeHiddenSlots } = await import('../scripts/utils.js');
  const result = sanitizeHiddenSlots({
    '1': true,
    '50': true,
    '0': true,
    '51': true,
    'not-a-number': true,
    '"] } body { background: red !important; } [x="': true,
    '25': 'yes'
  });
  assert.deepEqual(result, { 1: true, 50: true, 25: true });
});

test('sanitizeHiddenSlots handles non-object input', async () => {
  const { sanitizeHiddenSlots } = await import('../scripts/utils.js');
  assert.deepEqual(sanitizeHiddenSlots(null), {});
  assert.deepEqual(sanitizeHiddenSlots(undefined), {});
  assert.deepEqual(sanitizeHiddenSlots('not an object'), {});
  assert.deepEqual(sanitizeHiddenSlots(['array']), {});
});

test('sanitizeHiddenPages drops invalid entries and de-duplicates', async () => {
  const { sanitizeHiddenPages } = await import('../scripts/utils.js');
  assert.deepEqual(sanitizeHiddenPages([1, 2, 2, 6, 0, 'x', 3]), [1, 2, 3]);
  assert.deepEqual(sanitizeHiddenPages('not an array'), []);
  assert.deepEqual(sanitizeHiddenPages(null), []);
});

test('sanitizeSidebarTabs drops unknown tab ids and de-duplicates', async () => {
  const { sanitizeSidebarTabs } = await import('../scripts/utils.js');
  assert.deepEqual(
    sanitizeSidebarTabs(['chat', 'combat', 'chat', 'not-a-real-tab', '"] } body {']),
    ['chat', 'combat']
  );
  assert.deepEqual(sanitizeSidebarTabs('not an array'), []);
});

test('sanitizePerPlayerSettings only keeps known users and validates nested fields', async () => {
  installMocks({ users: [{ id: 'p1', isGM: false, name: 'Player One' }] });
  const { sanitizePerPlayerSettings } = await import('../scripts/utils.js');

  const result = sanitizePerPlayerSettings({
    p1: {
      hideChat: true,
      hideBackground: 'yes',
      hiddenSlots: { '1': true, '999': true },
      hiddenPages: [1, 99],
      hiddenSidebarTabs: ['chat', 'bogus']
    },
    'unknown-user-id': {
      hideChat: true
    }
  });

  assert.deepEqual(Object.keys(result), ['p1']);
  assert.equal(result.p1.hideChat, true);
  assert.equal(result.p1.hideBackground, true);
  assert.deepEqual(result.p1.hiddenSlots, { 1: true });
  assert.deepEqual(result.p1.hiddenPages, [1]);
  assert.deepEqual(result.p1.hiddenSidebarTabs, ['chat']);
});

test('sanitizePerPlayerSettings handles non-object input', async () => {
  const { sanitizePerPlayerSettings } = await import('../scripts/utils.js');
  assert.deepEqual(sanitizePerPlayerSettings(null), {});
  assert.deepEqual(sanitizePerPlayerSettings('nope'), {});
});

test('getSetting/setSetting round-trip through game.settings', async () => {
  const { getSetting, setSetting } = await import('../scripts/utils.js');
  const { MODULE_ID, SETTINGS } = await import('../scripts/constants.js');
  game.settings.register(MODULE_ID, SETTINGS.OPACITY, { default: 100 });
  assert.equal(getSetting(SETTINGS.OPACITY), 100);
  await setSetting(SETTINGS.OPACITY, 50);
  assert.equal(getSetting(SETTINGS.OPACITY), 50);
});

test('getSetting returns null and notifies on failure', async () => {
  const { getSetting } = await import('../scripts/utils.js');
  const result = getSetting('nonexistent-setting-key');
  assert.equal(result, null);
});

test('updateStyleElement creates and reuses a single style element', async () => {
  const { updateStyleElement } = await import('../scripts/utils.js');
  const { getElementRegistry } = await import('./foundry-mock.mjs');
  const { CSS_IDS } = await import('../scripts/constants.js');

  updateStyleElement('body { color: red; }');
  const first = getElementRegistry().get(CSS_IDS.STYLE_ELEMENT);
  assert.equal(first.textContent, 'body { color: red; }');

  updateStyleElement('body { color: blue; }');
  const second = getElementRegistry().get(CSS_IDS.STYLE_ELEMENT);
  assert.equal(second, first);
  assert.equal(second.textContent, 'body { color: blue; }');
});
