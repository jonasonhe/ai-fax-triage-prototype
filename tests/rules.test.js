// Run with: npm test   (or: node tests/rules.test.js)
const assert = require('node:assert/strict');
const { decideRoute, topCandidate, AUTO_FILE_MATCH_THRESHOLD } = require('../js/rules.js');
const { SAMPLE_FAXES } = require('../js/data.js');

const fax = (candidates) => ({ id: 'x', candidates });
const cand = (score) => ({ id: 'c', name: 'Test', score });

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('ok -', name);
}

test('threshold is 100%', () => {
  assert.equal(AUTO_FILE_MATCH_THRESHOLD, 100);
});

test('single 100% candidate auto-files', () => {
  assert.equal(decideRoute(fax([cand(100)])).route, 'auto');
});

test('88% candidate goes to triage', () => {
  const r = decideRoute(fax([cand(88)]));
  assert.equal(r.route, 'triage');
  assert.match(r.reason, /88%/);
});

test('99% candidate goes to triage', () => {
  assert.equal(decideRoute(fax([cand(99)])).route, 'triage');
});

test('no candidates goes to triage', () => {
  assert.equal(decideRoute(fax([])).route, 'triage');
});

test('100% with a competing candidate goes to triage', () => {
  assert.equal(decideRoute(fax([cand(100), cand(100)])).route, 'triage');
});

test('topCandidate picks the highest score regardless of order', () => {
  assert.equal(topCandidate(fax([cand(81), cand(88)])).score, 88);
  assert.equal(topCandidate(fax([])), null);
});

test('sample faxes route as designed', () => {
  const routes = Object.fromEntries(SAMPLE_FAXES.map(f => [f.id, decideRoute(f).route]));
  assert.deepEqual(routes, {
    f1: 'auto', f2: 'auto', f3: 'triage', f4: 'triage', f5: 'auto',
  });
});

console.log(`\n${passed} tests passed`);
