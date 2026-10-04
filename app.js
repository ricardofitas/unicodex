import { convertLatex } from './converter.js?v=1.1';

const el = (id) => document.getElementById(id);
const source = el('source');
const output = el('output');
const mode = el('mode');
const notation = el('notation');
const copy = el('copy');
let timer;
let result = { text: '', warnings: [], stats: {} };
const samples = {
  paragraph: String.raw`A body starts at rest. Its kinetic energy is $E_k=\frac{1}{2}mv^2$. The work is $W=\int_0^L F(x)\,dx=\Delta E_k$.

For constant force, $v=\sqrt{\frac{2FL}{m}}$.`,
  matrix: String.raw`Let $\mathbf{A}=\begin{bmatrix}1 & 2 \\ 3 & 4\end{bmatrix}$ and $\vec{v}=\begin{pmatrix}x \\ y\end{pmatrix}$. Then $\mathbf{A}\vec{v}=\vec{b}$.`,
  calculus: String.raw`\[\int_0^\infty e^{-x}\,dx=1\]
\[\sum_{i=1}^{n} i=\frac{n(n+1)}{2}\]
\[\prod_{k=1}^{n} k=n!\]`,
  alphabet: String.raw`Consider $\mathbb{R}^n$, $\mathcal{L}$, $\mathfrak{g}$, $\mathbf{F}=m\mathbf{a}$ and $\alpha\rightarrow\beta$.`,
  fractions: String.raw`\[f(x)=\frac{a+b}{c+d}+\frac{1}{1+\frac{x}{y}}+\sqrt[3]{x^2+1}\]`,
  aligned: String.raw`\[\begin{aligned}F &= ma \\ E_k &= \frac{1}{2}mv^2 \\ W &= \Delta E_k\end{aligned}\]`
};

function status(message, error = false) {
  el('status').textContent = message;
  el('status').classList.toggle('error', error);
}

function convert() {
  clearTimeout(timer);
  try {
    const portable=notation.value==='portable';
    result = convertLatex(source.value, { mode: mode.value, maxInputLength: 100000, matrixStyle: portable?'compact':'multiline', vectorStyle: portable?'label':'arrow' });
    output.value = result.text;
    el('input-count').textContent = `${Array.from(source.value).length.toLocaleString()} characters`;
    el('output-count').textContent = `${Array.from(result.text).length.toLocaleString()} characters`;
    copy.disabled = !result.text;
    const list = el('warnings');
    list.replaceChildren();
    for (const warning of result.warnings) {
      const item = document.createElement('li');
      item.textContent = warning.message;
      list.append(item);
    }
    el('warnings-panel').hidden = !result.warnings.length;
    status(source.value ? (result.warnings.length ? `Converted · ${result.warnings.length} note${result.warnings.length === 1 ? '' : 's'} to review.` : 'Converted · ready to copy.') : 'Ready.');
    return true;
  } catch (error) {
    output.value = '';
    copy.disabled = true;
    result = { text: '', warnings: [], stats: {} };
    el('warnings-panel').hidden = true;
    status(error instanceof Error ? error.message : 'Conversion failed. Check the input and try again.', true);
    return false;
  }
}

source.addEventListener('input', () => {
  copy.disabled = true;
  status('Converting…');
  clearTimeout(timer);
  timer = setTimeout(convert, 140);
});
mode.addEventListener('change', convert);
notation.addEventListener('change', convert);
el('convert').addEventListener('click', convert);
el('example').addEventListener('change', (event) => {
  if (!samples[event.target.value]) return;
  source.value = samples[event.target.value];
  mode.value = 'auto';
  convert();
});
el('clear').addEventListener('click', () => {
  source.value = '';
  el('example').value = '';
  convert();
  source.focus();
});
copy.addEventListener('click', async () => {
  if (!convert() || !result.text) return;
  const text = result.text;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    status('Copied Unicode to clipboard.');
  } catch {
    output.focus();
    output.select();
    output.setSelectionRange(0, output.value.length);
    try {
      if (!document.execCommand('copy')) throw new Error('Copy blocked');
      status('Copied Unicode to clipboard.');
    } catch {
      status('Clipboard access is blocked. The output is selected: press Ctrl+C or ⌘C to copy.', true);
    }
  }
});
source.value = samples.paragraph;
convert();
