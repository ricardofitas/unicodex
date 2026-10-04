import test from 'node:test';
import assert from 'node:assert/strict';
import { convertLatex } from '../converter.js';

// Exercise the real event handlers with a small dependency-free DOM adapter.
// Browser QA separately verifies rendering and user interaction.
class Element {
  constructor(id) { this.id = id; this.value = ''; this.textContent = ''; this.disabled = false; this.hidden = false; this.children = []; this.events = {}; this.classes = new Set(); this.classList = { toggle: (name, value) => value ? this.classes.add(name) : this.classes.delete(name) }; }
  addEventListener(name, fn) { this.events[name] = fn; }
  async dispatch(name) { if (name === 'click' && this.disabled) return; return this.events[name]?.({ target: this }); }
  replaceChildren() { this.children = []; }
  append(child) { this.children.push(child); }
  focus() { this.focused = true; }
  select() { this.selected = true; }
  setSelectionRange(start, end) { this.selection = [start, end]; }
}

let sequence = 0;
async function harness({ clipboard = 'success', fallback = true } = {}) {
  const ids = ['source','output','mode','notation','copy','input-count','output-count','status','warnings','warnings-panel','convert','example','clear'];
  const elements = Object.fromEntries(ids.map(id => [id, new Element(id)]));
  elements.mode.value = 'auto';
  elements.notation.value = 'unicode';
  const writes = [];
  let pending;
  const saved = Object.fromEntries(['document','navigator','setTimeout','clearTimeout'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { getElementById: id => elements[id], createElement: () => new Element('li'), execCommand: () => fallback } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: clipboard === 'missing' ? {} : { clipboard: { writeText: async text => { if (clipboard === 'blocked') throw Error('Permission denied'); writes.push(text); } } } });
  globalThis.setTimeout = fn => { pending = fn; return 1; };
  globalThis.clearTimeout = () => { pending = undefined; };
  await import(`../app.js?test=${sequence++}`);
  return { elements, writes, flush: () => { const fn = pending; pending = undefined; fn?.(); }, restore: () => { for (const [name, descriptor] of Object.entries(saved)) if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; } };
}

test('copy writes exactly the displayed Unicode paragraph', async () => {
  const h = await harness();
  try {
    const input = String.raw`A energia é $E=\frac{1}{2}mv^2$.

\[\begin{bmatrix}1&2\\3&4\end{bmatrix}\]`;
    h.elements.source.value = input;
    await h.elements.convert.dispatch('click');
    assert.equal(h.elements.output.value, convertLatex(input).text);
    await h.elements.copy.dispatch('click');
    assert.deepEqual(h.writes, [h.elements.output.value]);
    assert.match(h.elements.status.textContent, /Copied/);
  } finally { h.restore(); }
});

test('pending edits disable copy until automatic conversion finishes', async () => {
  const h = await harness();
  try {
    h.elements.source.value = String.raw`$\alpha+x^2$`;
    await h.elements.source.dispatch('input');
    assert.equal(h.elements.copy.disabled, true);
    h.flush();
    assert.equal(h.elements.copy.disabled, false);
    await h.elements.copy.dispatch('click');
    assert.deepEqual(h.writes, ['α+x²']);
  } finally { h.restore(); }
});

test('copy recomputes the current input instead of copying a stale preview', async () => {
  const h = await harness();
  try {
    h.elements.source.value = '$E=mc^2$';
    await h.elements.copy.dispatch('click');
    assert.deepEqual(h.writes, ['E=mc²']);
  } finally { h.restore(); }
});

test('blocked clipboard and failed fallback select output with honest guidance', async () => {
  const h = await harness({ clipboard: 'blocked', fallback: false });
  try {
    await h.elements.copy.dispatch('click');
    assert.deepEqual(h.writes, []);
    assert.equal(h.elements.output.selected, true);
    assert.match(h.elements.status.textContent, /blocked.*Ctrl\+C/);
    assert.ok(h.elements.status.classes.has('error'));
  } finally { h.restore(); }
});

test('legacy clipboard fallback is attempted when Clipboard API is unavailable', async () => {
  const h = await harness({ clipboard: 'missing' });
  try {
    await h.elements.copy.dispatch('click');
    assert.equal(h.elements.output.selected, true);
    assert.match(h.elements.status.textContent, /Copied/);
  } finally { h.restore(); }
});

test('clear removes both editors, conversion notes and pending timers', async () => {
  const h = await harness();
  try {
    await h.elements.source.dispatch('input');
    await h.elements.clear.dispatch('click');
    h.flush();
    assert.equal(h.elements.source.value, '');
    assert.equal(h.elements.output.value, '');
    assert.equal(h.elements.copy.disabled, true);
    assert.equal(h.elements['warnings-panel'].hidden, true);
    assert.equal(h.elements.source.focused, true);
  } finally { h.restore(); }
});

test('all six examples produce nonempty output and copy it exactly', async () => {
  const h = await harness();
  try {
    for (const example of ['paragraph','matrix','calculus','alphabet','fractions','aligned']) {
      h.elements.example.value = example;
      await h.elements.example.dispatch('change');
      assert.ok(h.elements.output.value.trim(), example);
      await h.elements.copy.dispatch('click');
      assert.equal(h.writes.at(-1), h.elements.output.value, example);
    }
  } finally { h.restore(); }
});

test('switching output notation updates and copies the matrices and vectors example', async () => {
  const h=await harness();
  try{
    h.elements.example.value='matrix';
    await h.elements.example.dispatch('change');
    const unicode=h.elements.output.value;
    assert.ok(unicode.includes('v⃗')&&unicode.includes('⎡'));
    await h.elements.copy.dispatch('click');
    assert.equal(h.writes.at(-1),unicode);
    h.elements.notation.value='portable';
    await h.elements.notation.dispatch('change');
    assert.equal(h.elements.output.value,'Let 𝐀=[1, 2; 3, 4] and vec(v)=(x; y). Then 𝐀vec(v)=vec(b).');
    await h.elements.copy.dispatch('click');
    assert.equal(h.writes.at(-1),h.elements.output.value);
    h.elements.notation.value='unicode';
    await h.elements.notation.dispatch('change');
    assert.equal(h.elements.output.value,unicode);
  }finally{h.restore();}
});

test('conversion notes are plain text and unsupported markup is not executed', async () => {
  const h = await harness();
  try {
    h.elements.source.value = String.raw`Before <img src=x onerror=alert(1)> $\custommacro{x}$ after.`;
    await h.elements.convert.dispatch('click');
    assert.match(h.elements.output.value, /<img src=x onerror=alert\(1\)>/);
    assert.equal(h.elements['warnings-panel'].hidden, false);
    assert.ok(h.elements.warnings.children.every(child => typeof child.textContent === 'string'));
  } finally { h.restore(); }
});
