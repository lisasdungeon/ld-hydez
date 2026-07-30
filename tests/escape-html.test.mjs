import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeHtml } from '../scripts/utils/escapeHtml.js';

const CASES = [
  ['', ''],
  ['Tom & Jerry', 'Tom &amp; Jerry'],
  ['Tom & Jerry < Friends', 'Tom &amp; Jerry &lt; Friends'],
  ['"quoted"', '&quot;quoted&quot;'],
  ["don't", 'don&#39;t'],
  ['back`tick', 'back&#96;tick'],
  ['<script>alert(1)</script>', '&lt;script&gt;alert(1)&lt;/script&gt;'],
  ['<img src=x onerror=alert(1)>', '&lt;img src=x onerror=alert(1)&gt;'],
  ['&lt;', '&amp;lt;'],
  [null, ''],
  [undefined, ''],
  [42, '42'],
  [-3.14, '-3.14'],
  [Infinity, 'Infinity'],
  [NaN, 'NaN'],
  [true, 'true'],
  [false, 'false'],
  [0, '0'],
  [{ toString: () => '<bad>' }, '&lt;bad&gt;'],
];

test('escapeHtml escapes HTML-significant characters', () => {
  for (const [input, expected] of CASES) {
    assert.equal(escapeHtml(input), expected, `mismatch on input ${JSON.stringify(input)}`);
  }
});
