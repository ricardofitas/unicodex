import test from 'node:test';
import assert from 'node:assert/strict';
import { convertLatex, supportedCommands } from '../converter.js';

const convert=(source,options={})=>convertLatex(source,options).text;
const hasWarning=(source,code,options={})=>convertLatex(source,options).warnings.some(w=>w.code===code);

test('mixed paragraphs retain Portuguese text, punctuation, newlines and spacing',()=>{
  const s=String.raw`A aceleração é $a=\frac{F}{m}$, em m/s².

Também usamos \(v_0 + at\).`;
  assert.equal(convert(s),'A aceleração é a=F/m, em m/s².\n\nTambém usamos v₀ + at.');
});

test('all four math delimiters and adjacent inline formulas work',()=>{
  assert.equal(convert(String.raw`$x^2$ $$y_1$$ \(z^3\) \[w_2\]`),'x² y₁ z³ w₂');
  assert.equal(convert('$x$$y$'),'xy');
});

test('plain Unicode paragraphs and meaningful prose braces remain unchanged',()=>{
  const s='Olá, Ricardo. Energia = ½mv².\n\nDados: {"a":1,"b":2}.';
  assert.equal(convert(s),s);
  assert.equal(convert(String.raw`Dados: {"a":1}. Fórmula \(a_1\).`),'Dados: {"a":1}. Fórmula a₁.');
});

test('currency dollar values are not mistaken for math delimiters',()=>{
  for(const s of ['The cost is $20 and $15.','Price: $20.50.','Costs $20,000 today.','A fee of $10','Fee $20; math $x^2$'])
    assert.equal(convert(s),s.replace('$x^2$','x²'));
  assert.equal(convert('$2x + 1$'),'2x + 1');
  assert.equal(convert('$2 + x$'),'2 + x');
});

test('Markdown inline code and fenced blocks stay literal',()=>{
  const s='Code `x_1` and '+String.raw`$x_1$`+'\n```tex\n'+String.raw`\frac{1}{2} $x^2$`+'\n```\n'+String.raw`$y^3$`;
  const expected='Code `x_1` and x₁\n```tex\n'+String.raw`\frac{1}{2} $x^2$`+'\n```\ny³';
  assert.equal(convert(s),expected);
  assert.equal(convert('``a ` b_1`` and $z^2$'),'``a ` b_1`` and z²');
  assert.equal(convert('~~~latex\n$x_1$\n~~~\n$x_1$'),'~~~latex\n$x_1$\n~~~\nx₁');
  assert.equal(convert('```tex\n$x_1$'),'```tex\n$x_1$');
});

test('explicit math and text modes provide predictable treatment of underscores',()=>{
  assert.equal(convert('snake_case',{mode:'text'}),'snake_case');
  assert.equal(convert('x_i^2',{mode:'math'}),'xᵢ²');
  assert.equal(convert('snake_case'),'snake_case');
  assert.equal(convert(String.raw`$a\_i$`),'a_i');
  assert.equal(convert(String.raw`\(x_i^2\)`,{mode:'math'}),'xᵢ²');
  assert.equal(convert(String.raw`$$\frac{1}{2}$$`,{mode:'math'}),'½');
  assert.equal(convert(String.raw`\rightarrow x^2`),'→ x²');
  assert.equal(convert(String.raw`The value of \alpha increases.`),'The value of α increases.');
  assert.equal(convert(String.raw`Data: {"a":1}. The value of \alpha increases.`),'Data: {"a":1}. The value of α increases.');
});

test('common fractions use Unicode fraction characters',()=>{
  assert.equal(convert(String.raw`\frac{1}{2}+\tfrac{2}{3}+\dfrac{3}{4}`),'½+⅔+¾');
});

test('fractions group complex numerators and denominators faithfully',()=>{
  assert.equal(convert(String.raw`\frac{a+b}{c+d}`),'(a+b)/(c+d)');
  assert.equal(convert(String.raw`\frac{a}{2x}`),'a/(2x)');
  assert.equal(convert(String.raw`\frac{a}{23}`),'a/23');
  assert.equal(convert(String.raw`\frac{ab}{cd}`),'(ab)/(cd)');
  assert.equal(convert(String.raw`\frac{(a)+(b)}{(c)+(d)}`),'((a)+(b))/((c)+(d))');
  assert.ok(hasWarning(String.raw`\frac{a+b}{c+d}`,'FRACTION_LINEAR'));
});

test('nested fractions cannot change the denominator grouping',()=>{
  assert.equal(convert(String.raw`\frac{a}{\frac{b+c}{d+e}}`),'a/((b+c)/(d+e))');
  assert.equal(convert(String.raw`\frac{\frac{a+b}{c+d}}{e}`),'((a+b)/(c+d))/e');
  assert.equal(convert(String.raw`\frac{\frac{1}{2}}{\frac{3}{4}}`),'½/¾');
});

test('TeX arguments need not always be braced',()=>{
  assert.equal(convert(String.raw`\frac12 + \sqrt x`),'½ + √x');
  assert.equal(convert(String.raw`x^2 + y_i`,{mode:'math'}),'x² + yᵢ');
});

test('Unicode scripts use a fallback only when a complete mapping is unavailable',()=>{
  assert.equal(convert(String.raw`$x^{n+1} + y_{i=1} + z_j$`),'xⁿ⁺¹ + yᵢ₌₁ + zⱼ');
  assert.equal(convert(String.raw`$x_b + z^{Q+1}$`),'x_(b) + z^(Q+1)');
  assert.ok(hasWarning(String.raw`$x_b$`,'SCRIPT_FALLBACK'));
  assert.equal(convert(String.raw`$x_{\alpha+\beta}$`),'x_(α+β)');
});

test('square, cubic, fourth and symbolic roots retain their index',()=>{
  assert.equal(convert(String.raw`\sqrt{x+1}+\sqrt[3]{x+1}+\sqrt[4]{x}+\sqrt[n]{x}`),'√(x+1)+∛(x+1)+∜x+ⁿ√x');
  assert.equal(convert(String.raw`\sqrt[Q]{x}`),'^(Q)√x');
});

test('integrals, sums and products retain limits and Greek symbols',()=>{
  assert.equal(convert(String.raw`\int_0^1 x^2\,\mathrm{d}x + \sum_{i=1}^n i + \prod_{k=1}^m k`),'∫₀¹ x²\u2009dx + ∑ᵢ₌₁ⁿ i + ∏ₖ₌₁ᵐ k');
  assert.equal(convert(String.raw`\iint + \iiint + \oint + \oiint`),'∬ + ∭ + ∮ + ∯');
});

test('Greek variants, arrows, set symbols and relations have useful coverage',()=>{
  assert.equal(convert(String.raw`$\alpha+\varepsilon+\epsilon+\varphi+\phi+\Gamma$`),'α+ε+ϵ+φ+ϕ+Γ');
  assert.equal(convert(String.raw`$A\subseteq B\Rightarrow x\in B, x\notin C$`),'A⊆ B⇒ x∈ B, x∉ C');
  assert.equal(convert(String.raw`$a\mapsto b\leftrightarrow c\ne d\le e$`),'a↦ b↔ c≠ d≤ e');
  assert.equal(convert(String.raw`$\not\in + \not= + \not\Rightarrow$`),'∉ + ≠ + ⇏');
});

test('named operators are separated from their argument',()=>{
  assert.equal(convert(String.raw`$\sin x + \cos(y) + \log x + \sin^2 x$`),'sin x + cos(y) + log x + sin² x');
  assert.equal(convert(String.raw`$\operatorname{arg\,min}_x f(x)$`),'arg\u2009minₓ f(x)');
});

test('sized delimiters retain their visible mathematical symbols',()=>{
  assert.equal(convert(String.raw`$\left\langle v,w\right\rangle$`),'⟨ v,w⟩');
  assert.equal(convert(String.raw`$\left.\frac{dy}{dx}\right|_{x=0}$`),'(dy)/(dx)|ₓ₌₀');
  assert.equal(convert(String.raw`$\left\{x\in\mathbb{R}\right\}$`),'{x∈ℝ}');
});

test('mathematical alphabets include Unicode legacy exceptions',()=>{
  assert.equal(convert(String.raw`$\mathbb{RNC}+\mathcal{BEH}+\mathfrak{CRZ}+\mathit{h}+\mathbf{x2}$`),'ℝℕℂ+ℬℰℋ+ℭℜℨ+ℎ+𝐱𝟐');
  assert.equal(convert(String.raw`$\mathbb{012}+\mathsf{Ax}+\mathtt{Az}$`),'𝟘𝟙𝟚+𝖠𝗑+𝙰𝚣');
});

test('bold and italic Greek are supported and missing alphabets are disclosed',()=>{
  assert.equal(convert(String.raw`$\boldsymbol{\beta}+\mathbf{\alpha}+\mathit{\omega}$`),'𝛃+𝛂+𝜔');
  assert.equal(convert(String.raw`$\mathcal{\alpha}$`),'α');
  assert.ok(hasWarning(String.raw`$\mathcal{\alpha}$`,'STYLE_PARTIAL'));
});

test('text groups, accents and escaped punctuation preserve their meaning',()=>{
  assert.equal(convert(String.raw`$x\text{ if }x>0$`),'x if x>0');
  assert.equal(convert(String.raw`\textbf{Bold} and \emph{emphasis}`),'𝐁𝐨𝐥𝐝 and 𝑒𝑚𝑝ℎ𝑎𝑠𝑖𝑠');
  assert.equal(convert(String.raw`$\hat{x}+\vec{v}+\dot{a}+\overline{AB}$`),'x̂+v⃗+ȧ+A̅B̅');
  assert.equal(convert(String.raw`$\vec{AB}$`),'(AB)⃗');
  assert.ok(hasWarning(String.raw`$\vec{AB}$`,'ACCENT_LINEAR'));
  assert.equal(convert(String.raw`\'a, \~o, \"u, \$20, \% and \&`),'á, õ, ü, $20, % and &');
});

test('matrix rows, columns and outer brackets remain explicit',()=>{
  assert.equal(convert(String.raw`\begin{bmatrix}1&2\\3&4\end{bmatrix}`),'⎡ 1  2 ⎤\n⎣ 3  4 ⎦');
  assert.equal(convert(String.raw`\begin{pmatrix}a&b\\c&d\\e&f\end{pmatrix}`),'⎛ a  b ⎞\n⎜ c  d ⎟\n⎝ e  f ⎠');
  assert.equal(convert(String.raw`\begin{vmatrix}a&b\end{vmatrix}`),'| a  b |');
  assert.ok(hasWarning(String.raw`\begin{matrix}a&b\end{matrix}`,'MATRIX_MULTILINE'));
});

test('padded matrix columns survive display delimiters',()=>{
  const s=String.raw`\begin{bmatrix}1&1000\\100&2\end{bmatrix}`;
  assert.equal(convert(s),'⎡ 1    1000 ⎤\n⎣ 100  2 ⎦');
  assert.equal(convert('\\['+s+'\\]'),convert(s));
});

test('nested matrices use an unambiguous linear cell representation',()=>{
  const s=String.raw`\begin{bmatrix}\begin{bmatrix}1&2\\3&4\end{bmatrix}&x\\y&z\end{bmatrix}`;
  const result=convertLatex(s);
  assert.equal(result.text.split('\n').length,2);
  assert.ok(result.text.includes('[[1, 2]; [3, 4]]'));
  assert.ok(result.warnings.some(w=>w.code==='NESTED_MATRIX_LINEAR'));
});

test('array alignment specs are excluded and escaped ampersands are literal',()=>{
  assert.equal(convert(String.raw`\begin{array}{cc}a&b\\c&d\end{array}`),'a  b\nc  d');
  assert.equal(convert(String.raw`\begin{matrix}\text{A\&B}&x\end{matrix}`),'A&B  x');
});

test('cases and aligned equations retain every branch and row',()=>{
  assert.equal(convert(String.raw`\begin{cases}x&\text{if }x>0\\-x&\text{otherwise}\end{cases}`),'⎧ x   if x>0\n⎩ -x  otherwise');
  assert.equal(convert(String.raw`\begin{aligned}a&=b+c\\d&=e-f\end{aligned}`),'a =b+c\nd =e-f');
  assert.equal(convert(String.raw`\begin{alignat}{2}a&=b\\c&=d\end{alignat}`),'a =b\nc =d');
});

test('row spacing directives do not become a new matrix cell',()=>{
  assert.equal(convert(String.raw`\begin{bmatrix}a&b\\[2pt]c&d\end{bmatrix}`),'⎡ a  b ⎤\n⎣ c  d ⎦');
});

test('binomial coefficients, modulo and annotations have honest linear fallbacks',()=>{
  assert.equal(convert(String.raw`$\binom{n}{k} + a\pmod{n}$`),'(n choose k) + a(mod n)');
  assert.equal(convert(String.raw`$\overset{def}{=} + \underset{i}{x}$`),'= [above: def] + x [below: i]');
  assert.ok(hasWarning(String.raw`$\overset{def}{=}$`,'ANNOTATION_LINEAR'));
});

test('unknown commands and their nested option/argument groups stay visible',()=>{
  const s=String.raw`$\unknown[option]{a{b}} + x$`;
  assert.equal(convert(s),String.raw`\unknown[option]{a{b}} + x`);
  assert.ok(hasWarning(s,'UNKNOWN_COMMAND'));
  assert.equal(convert(String.raw`\begin{tikzpicture}raw \foo{1}\end{tikzpicture}`),String.raw`\begin{tikzpicture}raw \foo{1}\end{tikzpicture}`);
  assert.ok(hasWarning(String.raw`\begin{tikzpicture}x\end{tikzpicture}`,'UNKNOWN_ENVIRONMENT'));
});

test('TeX file access and macro definitions are retained, never executed',()=>{
  const s=String.raw`\input{secret.txt} \newcommand{\foo}[1]{#1}`;
  assert.equal(convert(s),s);
  assert.ok(hasWarning(s,'NON_EXECUTED_COMMAND'));
});

test('unresolved references and discarded color are disclosed',()=>{
  assert.equal(convert(String.raw`See \eqref{eq:one} and \href{https://example.com}{source}.`),'See [eq:one] and source (https://example.com).');
  assert.ok(hasWarning(String.raw`\eqref{eq:one}`,'UNRESOLVED_REFERENCE'));
  assert.equal(convert(String.raw`$\textcolor{red}{x^2}$`),'x²');
  assert.ok(hasWarning(String.raw`$\textcolor{red}{x}$`,'STYLE_REMOVED'));
});

test('URLs keep literal underscores and braces inside the URL argument',()=>{
  assert.equal(convert(String.raw`\url{https://example.com/a_b?q={x}}`),'https://example.com/a_b?q={x}');
  assert.equal(convert('Visit https://example.com/a_b and $x^2$.'),'Visit https://example.com/a_b and x².');
});

test('malformed groups and arguments retain the unconverted original content',()=>{
  assert.equal(convert(String.raw`\frac{x`),String.raw`\frac{x`);
  assert.equal(convert(String.raw`\frac{x}`),String.raw`\frac{x}`);
  assert.ok(hasWarning(String.raw`\frac{x}`,'MISSING_ARGUMENT'));
  assert.equal(convert(String.raw`$\alpha}depois$`),'α}depois');
  assert.ok(hasWarning(String.raw`$\alpha}depois$`,'UNMATCHED_GROUP'));
  assert.equal(convert(String.raw`\begin{matrix}a&b`),String.raw`\begin{matrix}a&b`);
  assert.ok(hasWarning(String.raw`\begin{matrix}a&b`,'UNMATCHED_ENVIRONMENT'));
});

test('unmatched delimiters and trailing backslashes do not lose source text',()=>{
  const s=String.raw`Before \(x^2 and later`;
  assert.equal(convert(s),s);
  assert.ok(hasWarning(s,'UNMATCHED_DELIMITER'));
  assert.equal(convert('unfinished\\'),'unfinished\\');
  assert.ok(hasWarning('unfinished\\','TRAILING_BACKSLASH'));
  for(const s of [String.raw`\left`,String.raw`\right`,String.raw`\not`]){
    assert.equal(convert(s,{mode:'math'}),s);
    assert.ok(hasWarning(s,'MISSING_ARGUMENT',{mode:'math'}));
  }
});

test('Unicode output is stable when converted again',()=>{
  for(const s of [String.raw`$x^2+\alpha$`,String.raw`\frac{a+b}{c+d}`,String.raw`\begin{bmatrix}1&2\\3&4\end{bmatrix}`,String.raw`$x_b$`]){
    const once=convert(s);assert.equal(convert(once),once);
  }
});

test('input limits return input unchanged and nesting limits preserve a literal tail',()=>{
  const s='a'.repeat(100);
  assert.equal(convert(s,{maxInputLength:50}),s);
  assert.ok(hasWarning(s,'INPUT_TOO_LONG',{maxInputLength:50}));
  const deep='\\frac{'.repeat(150)+'x'+'}{y}'.repeat(150);
  const result=convertLatex(deep,{maxDepth:10});
  assert.ok(result.text.includes('\\frac'));
  assert.ok(result.warnings.some(w=>w.code==='DEPTH_LIMIT'));
  for(const command of ['not','hat','sqrt','left']){
    const source=('\\'+command+' ').repeat(3000)+'x';
    const limited=convertLatex(source,{mode:'math'});
    assert.ok(limited.warnings.some(w=>w.code==='DEPTH_LIMIT'));
    assert.ok(limited.text.includes('\\'+command));
  }
});

test('warnings have a bounded count while statistics record the entire input',()=>{
  const result=convertLatex(String.raw`\unknown{x} `.repeat(200));
  assert.equal(result.warnings.length,101);
  assert.equal(result.stats.unsupportedCommands,200);
  assert.equal(result.stats.inputCharacters,Array.from(String.raw`\unknown{x} `.repeat(200)).length);
  assert.equal(result.stats.outputCharacters,Array.from(result.text).length);
  assert.equal(result.warnings.at(-1).code,'ADDITIONAL_WARNINGS');
});

test('every declared command handles a missing argument without throwing',()=>{
  assert.ok(supportedCommands.length>300);
  for(const name of supportedCommands)assert.doesNotThrow(()=>convertLatex('\\'+name,{mode:'math'}));
});

test('deterministic malformed-input fuzzing cannot crash or produce unbounded output',()=>{
  let state=123456789;
  const chars=Array.from('abc012{}[]_^\\$&+-() αβ');
  for(let sample=0;sample<500;sample++){
    let source='';
    for(let i=0;i<80;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;source+=chars[state%chars.length];}
    const result=convertLatex(source);
    assert.equal(typeof result.text,'string');
    assert.ok(result.text.length<source.length*10+100);
    assert.ok(result.warnings.length<=101);
    for(const w of result.warnings){assert.equal(typeof w.code,'string');assert.equal(typeof w.message,'string');}
  }
});

test('invalid input is rejected clearly',()=>{
  assert.throws(()=>convertLatex(null),TypeError);
  assert.equal(convert('',{maxDepth:0}),'');
});
