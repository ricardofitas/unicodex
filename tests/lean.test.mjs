import test from 'node:test';
import assert from 'node:assert/strict';
import { convertLatex } from '../converter.js';
const text = (input, options = {}) => convertLatex(input, { mode: 'math', ...options }).text;
test('named functions and their powers stay separated from adjacent factors with flexible TeX arguments', () => {
  assert.equal(text(String.raw`3b\ddot\theta\sin\theta + 4b\dot\theta^2\cos\theta`), '3bθ̈ sin θ + 4bθ̇² cos θ');
  assert.equal(text(String.raw`3b\ddot{\theta}\sin{\theta}`), text(String.raw`3b\ddot\theta\sin\theta`));
  assert.equal(text(String.raw`\sin^{4}{\theta}`), 'sin⁴ θ');
  assert.equal(text(String.raw`\sin^4\theta`), 'sin⁴ θ');
  assert.equal(text(String.raw`x\cos(y)\sin(z)`), 'x cos(y) sin(z)');
});
test('lean fractions remove only redundant numerator grouping', () => {
  assert.equal(text(String.raw`\frac{b\ddot\theta\sin^3\theta}{\cos^2\theta}`, { lean: true }), 'bθ̈ sin³ θ/(cos² θ)');
  assert.equal(text(String.raw`b\ddot\theta\frac{\sin^2\theta}{\cos\theta}`, { lean: true }), 'bθ̈ sin² θ/(cos θ)');
  assert.equal(text(String.raw`\frac{a+b}{2x}`, { lean: true }), '(a+b)/(2x)');
  assert.equal(text(String.raw`\frac{ab}{cd}`, { lean: true }), 'ab/(cd)');
  assert.equal(text(String.raw`\frac{\frac{a}{b}}{c}`, { lean: true }), '(a/b)/c');
  assert.equal(text(String.raw`\frac{a}{\frac{b+c}{d+e}}`, { lean: true }), 'a/((b+c)/(d+e))');
  assert.equal(text(String.raw`\frac{a\to b}{c}`, { lean: true }), '(a→ b)/c');
  assert.equal(text(String.raw`\frac{ab}{cd}`, { lean: false }), '(ab)/(cd)');
});
test('the original full polar expression keeps all nine terms and identifies the unavailable theta index', () => {
  const input = String.raw`$\left( 2b\dot\theta^2 \frac{ \sin^4\theta}{\cos^3\theta} + \frac{b\ddot\theta \sin^3\theta}{\cos^2\theta} + 2b\dot\theta^2 \frac{\sin^2\theta}{\cos\theta} + 3b\ddot\theta\sin\theta + 4b\dot\theta^2\cos\theta \right) \mathbf{e}_{r} + \left( 2b\dot\theta^2 \frac{ \sin^3\theta}{\cos^2\theta} + 6b\dot\theta^2\sin\theta + b\ddot\theta\frac{\sin^2\theta}{\cos\theta} - b\ddot\theta\cos\theta \right) \mathbf{e}_{\theta}$`;
  const result = convertLatex(input, { lean: true, matrixStyle: 'compact' });
  assert.equal(result.text, '( 2bθ̇² sin⁴ θ/(cos³ θ) + bθ̈ sin³ θ/(cos² θ) + 2bθ̇² sin² θ/(cos θ) + 3bθ̈ sin θ + 4bθ̇² cos θ ) 𝐞ᵣ + ( 2bθ̇² sin³ θ/(cos² θ) + 6bθ̇² sin θ + bθ̈ sin² θ/(cos θ) - bθ̈ cos θ ) 𝐞_(θ)');
  assert.match(result.warnings.find(w => w.code === 'SCRIPT_FALLBACK').message, /θ.*_\(θ\)/);
  assert.equal(convertLatex(result.text, { lean: true }).text, result.text);
});
