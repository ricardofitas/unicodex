/**
 * Unicodex deterministic LaTeX → plain Unicode engine.
 * It never executes TeX, expands user macros, loads files, or calls a network.
 * Fractions, roots, matrices and annotations use an explicit linear/multiline
 * representation when a plain-text character cannot carry the original layout.
 */

const SYMBOLS = Object.freeze({
  alpha:'α', beta:'β', gamma:'γ', delta:'δ', epsilon:'ϵ', varepsilon:'ε', zeta:'ζ', eta:'η', theta:'θ', vartheta:'ϑ', iota:'ι', kappa:'κ', varkappa:'ϰ', lambda:'λ', mu:'μ', nu:'ν', xi:'ξ', omicron:'ο', pi:'π', varpi:'ϖ', rho:'ρ', varrho:'ϱ', sigma:'σ', varsigma:'ς', tau:'τ', upsilon:'υ', phi:'ϕ', varphi:'φ', chi:'χ', psi:'ψ', omega:'ω',
  Alpha:'Α', Beta:'Β', Gamma:'Γ', Delta:'Δ', Epsilon:'Ε', Zeta:'Ζ', Eta:'Η', Theta:'Θ', Iota:'Ι', Kappa:'Κ', Lambda:'Λ', Mu:'Μ', Nu:'Ν', Xi:'Ξ', Omicron:'Ο', Pi:'Π', Rho:'Ρ', Sigma:'Σ', Tau:'Τ', Upsilon:'Υ', Phi:'Φ', Chi:'Χ', Psi:'Ψ', Omega:'Ω',
  pm:'±', mp:'∓', times:'×', div:'÷', cdot:'⋅', ast:'∗', star:'⋆', circ:'∘', bullet:'∙', diamond:'⋄', oplus:'⊕', ominus:'⊖', otimes:'⊗', oslash:'⊘', odot:'⊙', bigoplus:'⨁', bigotimes:'⨂', bigodot:'⨀', dagger:'†', ddagger:'‡', amalg:'⨿', wr:'≀',
  le:'≤', leq:'≤', ge:'≥', geq:'≥', ne:'≠', neq:'≠', equiv:'≡', approx:'≈', approxeq:'≊', sim:'∼', simeq:'≃', cong:'≅', propto:'∝', ll:'≪', gg:'≫', lesssim:'≲', gtrsim:'≳', lessapprox:'⪅', gtrapprox:'⪆', prec:'≺', succ:'≻', preceq:'≼', succeq:'≽', doteq:'≐', triangleq:'≜', asymp:'≍', models:'⊨', vdash:'⊢', dashv:'⊣', Vdash:'⊩', vDash:'⊨', perp:'⊥', parallel:'∥', nparallel:'∦', mid:'∣', nmid:'∤', bowtie:'⋈', smile:'⌣', frown:'⌢',
  in:'∈', notin:'∉', ni:'∋', owns:'∋', subset:'⊂', supset:'⊃', subseteq:'⊆', supseteq:'⊇', subsetneq:'⊊', supsetneq:'⊋', nsubseteq:'⊈', nsupseteq:'⊉', cup:'∪', cap:'∩', bigcup:'⋃', bigcap:'⋂', uplus:'⊎', biguplus:'⨄', sqcup:'⊔', sqcap:'⊓', bigsqcup:'⨆', setminus:'∖', smallsetminus:'∖', emptyset:'∅', varnothing:'∅', complement:'∁',
  forall:'∀', exists:'∃', nexists:'∄', neg:'¬', lnot:'¬', land:'∧', wedge:'∧', lor:'∨', vee:'∨', bigwedge:'⋀', bigvee:'⋁', top:'⊤', bot:'⊥', therefore:'∴', because:'∵',
  to:'→', rightarrow:'→', leftarrow:'←', leftrightarrow:'↔', Rightarrow:'⇒', Leftarrow:'⇐', Leftrightarrow:'⇔', implies:'⇒', impliedby:'⇐', iff:'⇔', mapsto:'↦', longmapsto:'⟼', longrightarrow:'⟶', longleftarrow:'⟵', longleftrightarrow:'⟷', Longrightarrow:'⟹', Longleftarrow:'⟸', Longleftrightarrow:'⟺', hookrightarrow:'↪', hookleftarrow:'↩', uparrow:'↑', downarrow:'↓', updownarrow:'↕', Uparrow:'⇑', Downarrow:'⇓', Updownarrow:'⇕', nearrow:'↗', searrow:'↘', swarrow:'↙', nwarrow:'↖', rightleftharpoons:'⇌', leftrightharpoons:'⇋', rightharpoonup:'⇀', rightharpoondown:'⇁', leftharpoonup:'↼', leftharpoondown:'↽', rightsquigarrow:'⇝', leadsto:'⇝', nrightarrow:'↛', nleftarrow:'↚', nleftrightarrow:'↮', nRightarrow:'⇏', nLeftarrow:'⇍', nLeftrightarrow:'⇎',
  sum:'∑', prod:'∏', coprod:'∐', int:'∫', iint:'∬', iiint:'∭', iiiint:'⨌', oint:'∮', oiint:'∯', oiiint:'∰', smallint:'∫',
  infty:'∞', partial:'∂', nabla:'∇', hbar:'ℏ', ell:'ℓ', Re:'ℜ', Im:'ℑ', aleph:'ℵ', beth:'ℶ', gimel:'ℷ', daleth:'ℸ', wp:'℘', imath:'ı', jmath:'ȷ', degree:'°', angle:'∠', measuredangle:'∡', sphericalangle:'∢', triangle:'△', square:'□', Box:'□', checkmark:'✓', prime:'′', backprime:'‵', colon:':', ldots:'…', dots:'…', cdots:'⋯', vdots:'⋮', ddots:'⋱', dotsc:'…', dotsb:'⋯', dotsm:'⋯', dotsi:'⋯', dotso:'…',
  langle:'⟨', rangle:'⟩', lceil:'⌈', rceil:'⌉', lfloor:'⌊', rfloor:'⌋', lbrace:'{', rbrace:'}', lbrack:'[', rbrack:']', lvert:'|', rvert:'|', vert:'|', lVert:'‖', rVert:'‖', Vert:'‖', backslash:'\\', percent:'%', pounds:'£', euro:'€', S:'§', P:'¶', copyright:'©', textregistered:'®', texttrademark:'™', textdegree:'°', textmu:'µ', texttimes:'×', textendash:'–', textemdash:'—', textellipsis:'…', LaTeX:'LaTeX', TeX:'TeX',
});

const FUNCTIONS = new Set('sin cos tan cot sec csc arcsin arccos arctan sinh cosh tanh coth arsinh arcosh artanh log ln exp lim limsup liminf min max sup inf det gcd Pr ker dim hom arg deg diag rank tr trace erf sgn'.split(' '));
const SUPER = Object.freeze(Object.fromEntries([...Object.entries({
  '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','−':'⁻','=':'⁼','(':'⁽',')':'⁾',
  a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ',
  A:'ᴬ',B:'ᴮ',D:'ᴰ',E:'ᴱ',G:'ᴳ',H:'ᴴ',I:'ᴵ',J:'ᴶ',K:'ᴷ',L:'ᴸ',M:'ᴹ',N:'ᴺ',O:'ᴼ',P:'ᴾ',R:'ᴿ',T:'ᵀ',U:'ᵁ',V:'ⱽ',W:'ᵂ',
  α:'ᵅ',β:'ᵝ',γ:'ᵞ',δ:'ᵟ',ε:'ᵋ',ϵ:'ᵋ',θ:'ᶿ',ι:'ᶥ',φ:'ᵠ',ϕ:'ᵠ',χ:'ᵡ',
})]));
const SUB = Object.freeze({
  '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','+':'₊','-':'₋','−':'₋','=':'₌','(':'₍',')':'₎',
  a:'ₐ',e:'ₑ',h:'ₕ',i:'ᵢ',j:'ⱼ',k:'ₖ',l:'ₗ',m:'ₘ',n:'ₙ',o:'ₒ',p:'ₚ',r:'ᵣ',s:'ₛ',t:'ₜ',u:'ᵤ',v:'ᵥ',x:'ₓ',β:'ᵦ',γ:'ᵧ',ρ:'ᵨ',φ:'ᵩ',ϕ:'ᵩ',χ:'ᵪ',
});
const VULGAR = Object.freeze({'1/2':'½','1/3':'⅓','2/3':'⅔','1/4':'¼','3/4':'¾','1/5':'⅕','2/5':'⅖','3/5':'⅗','4/5':'⅘','1/6':'⅙','5/6':'⅚','1/8':'⅛','3/8':'⅜','5/8':'⅝','7/8':'⅞','1/7':'⅐','1/9':'⅑','1/10':'⅒'});
const ACCENTS = Object.freeze({hat:'\u0302',widehat:'\u0302',tilde:'\u0303',widetilde:'\u0303',bar:'\u0304',overline:'\u0305',underline:'\u0332',dot:'\u0307',ddot:'\u0308',dddot:'\u20DB',ddddot:'\u20DC',breve:'\u0306',check:'\u030C',acute:'\u0301',grave:'\u0300',vec:'\u20D7',overrightarrow:'\u20D7',overleftarrow:'\u20D6',overleftrightarrow:'\u20E1'});
const STYLES = Object.freeze({mathbf:'bold',boldsymbol:'bold',bm:'bold',mathit:'italic',mathcal:'script',mathscr:'script',mathbb:'double',mathfrak:'fraktur',mathsf:'sans',mathtt:'mono',textbf:'bold',textit:'italic',emph:'italic',texttt:'mono',textsf:'sans'});
const TEXT_COMMANDS = new Set(['text','textrm','textnormal','textup','mbox','mathrm','mathnormal','operatorname']);
const LAYOUT_COMMANDS = new Set(['displaystyle','textstyle','scriptstyle','scriptscriptstyle','limits','nolimits','protect','relax']);
const ENVIRONMENTS = new Set(['matrix','pmatrix','bmatrix','Bmatrix','vmatrix','Vmatrix','smallmatrix','array','cases','dcases','aligned','align','align*','alignedat','alignat','alignat*','gather','gather*','gathered','equation','equation*','split','multline','multline*']);
const UNSAFE = new Set(['input','include','includegraphics','write','write18','openout','read','catcode','def','gdef','edef','xdef','let','newcommand','renewcommand','providecommand','newenvironment','renewenvironment','usepackage','documentclass']);
const NEGATIONS = Object.freeze({'=':'≠','∈':'∉','∋':'∌','<':'≮','>':'≯','≤':'≰','≥':'≱','≡':'≢','∼':'≁','≈':'≉','⊂':'⊄','⊃':'⊅','⊆':'⊈','⊇':'⊉','→':'↛','←':'↚','↔':'↮','⇒':'⇏','⇐':'⇍','⇔':'⇎','∣':'∤','∥':'∦'});

const isEscaped = (s, i) => { let n = 0; while (i > 0 && s[--i] === '\\') n++; return n % 2 === 1; };
const cleanMath = (s) => (s.includes('\n')?s.split('\n').map(line=>line.trimEnd()).join('\n'):s.replace(/[\t ]+/g, ' ')).trim();
function groupIfNeeded(s) {
  // An outer pair must enclose the entire operand, not merely its first/last term.
  let depth=0, enclosed=s.startsWith('(')&&s.endsWith(')');
  if(enclosed)for(let i=0;i<s.length;i++){if(s[i]==='(')depth++;if(s[i]===')')depth--;if(depth===0&&i<s.length-1){enclosed=false;break;}}
  const atom=/^[-−]?(?:\d+(?:\.\d+)?|\p{L}\p{M}*[\u2070-\u209F\u00B2\u00B3\u00B9]*|\p{N})$/u.test(s);
  return atom||enclosed?s:`(${s})`;
}
const codepointWidth = (s) => Array.from(s).filter(c => !/\p{M}/u.test(c)).length;
const alignContinuation = (text, column) => text.replace(/\n/g, '\n'+' '.repeat(column));
const VECTOR_ACCENTS = new Set(['vec','overrightarrow','overleftarrow','overleftrightarrow']);
const SCRIPT_GLYPHS = new Set([...Object.values(SUPER),...Object.values(SUB)]);

function styled(text, style, ctx, offset) {
  const config = {
    bold: [0x1D400,0x1D41A,0x1D7CE], italic: [0x1D434,0x1D44E,null], script: [0x1D49C,0x1D4B6,null],
    double: [0x1D538,0x1D552,0x1D7D8], fraktur: [0x1D504,0x1D51E,null], sans: [0x1D5A0,0x1D5BA,0x1D7E2], mono: [0x1D670,0x1D68A,0x1D7F6],
  }[style];
  const exceptions = {
    italic:{h:'ℎ'}, script:{B:'ℬ',E:'ℰ',F:'ℱ',H:'ℋ',I:'ℐ',L:'ℒ',M:'ℳ',R:'ℛ',e:'ℯ',g:'ℊ',o:'ℴ'},
    double:{C:'ℂ',H:'ℍ',N:'ℕ',P:'ℙ',Q:'ℚ',R:'ℝ',Z:'ℤ'}, fraktur:{C:'ℭ',H:'ℌ',I:'ℑ',R:'ℜ',Z:'ℨ'},
  }[style] || {};
  const greek={};
  if(style==='bold'||style==='italic') {
    const upper=style==='bold'?0x1D6A8:0x1D6E2, lower=style==='bold'?0x1D6C2:0x1D6FC;
    Array.from('ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡϴΣΤΥΦΧΨΩ').forEach((c,i)=>greek[c]=String.fromCodePoint(upper+i));
    Array.from('αβγδεζηθικλμνξοπρςστυφχψω').forEach((c,i)=>greek[c]=String.fromCodePoint(lower+i));
    ['∇','∂','ϵ','ϑ','ϰ','ϕ','ϱ','ϖ'].forEach((c,i)=>greek[c]=String.fromCodePoint(i===0?lower-1:lower+24+i));
  }
  let incomplete=false;
  const output=Array.from(text, c => {
    if (exceptions[c]) return exceptions[c];
    if (/[A-Z]/.test(c)) return String.fromCodePoint(config[0]+c.charCodeAt(0)-65);
    if (/[a-z]/.test(c)) return String.fromCodePoint(config[1]+c.charCodeAt(0)-97);
    if (/[0-9]/.test(c) && config[2]) return String.fromCodePoint(config[2]+c.charCodeAt(0)-48);
    if(greek[c])return greek[c];
    if(/\p{L}/u.test(c))incomplete=true;
    return c;
  }).join('');
  if(incomplete)warning(ctx,'STYLE_PARTIAL','Some letters have no character in the requested Unicode alphabet and were left unchanged.',offset,true);
  return output;
}

function warning(ctx, code, message, offset, lossy = false) {
  if (ctx.warnings.length < 100) ctx.warnings.push({code,message,...(Number.isInteger(offset)?{offset}:{})});
  else ctx.additionalWarnings++;
  if (lossy) ctx.stats.lossyConversions++;
}

function script(text, kind, ctx, offset) {
  const value = text.trim();
  const table = kind === '^' ? SUPER : SUB;
  // In a math script, ordinary spacing is TeX layout rather than part of its value.
  const chars = Array.from(value.replace(/[ \t]/g, ''));
  if (chars.length && chars.every(c => table[c])) return chars.map(c=>table[c]).join('');
  warning(ctx,'SCRIPT_FALLBACK',`Some ${kind === '^' ? 'superscript' : 'subscript'} characters have no Unicode counterpart; explicit parentheses preserve the value.`,offset,true);
  return `${kind}(${value})`;
}

class Parser {
  constructor(source, ctx, offset=0, depth=0, math=true, prose=false, inMatrix=false) { this.s=source; this.i=0; this.ctx=ctx; this.offset=offset; this.depth=depth; this.math=math; this.prose=prose; this.inMatrix=inMatrix; this.atomDepth=0; }
  warn(code, message, index=this.i, lossy=false) { warning(this.ctx,code,message,this.offset+index,lossy); }
  whitespace() { while (/\s/.test(this.s[this.i] || '') && this.i < this.s.length) this.i++; }
  rawGroup(open='{', close='}') {
    if (this.s[this.i] !== open) return null;
    const start=this.i++; let nesting=1;
    while (this.i < this.s.length) {
      const c=this.s[this.i++];
      if (c==='\\') { if (this.i < this.s.length) this.i++; continue; }
      if (c===open) nesting++;
      if (c===close && --nesting===0) return {raw:this.s.slice(start,this.i),inner:this.s.slice(start+1,this.i-1),start,closed:true};
      if (c!==close) continue;
    }
    this.warn('UNMATCHED_GROUP',`An opening ${open} has no matching ${close}; the original group is retained.`,start);
    return {raw:this.s.slice(start),inner:this.s.slice(start+1),start,closed:false};
  }
  child(raw, math=this.math) {
    if (!raw.closed) return raw.raw;
    if (this.depth >= this.ctx.maxDepth) { this.warn('DEPTH_LIMIT','The nesting limit was reached; this group remains as LaTeX.',raw.start); return raw.raw; }
    return new Parser(raw.inner,this.ctx,this.offset+raw.start+1,this.depth+1,math,false,this.inMatrix).parse();
  }
  argument(math=this.math, required=true) {
    this.whitespace();
    const start=this.i;
    if (this.i >= this.s.length || this.s[this.i]==='}') { if(required) this.warn('MISSING_ARGUMENT','A command is missing an argument.',start); return null; }
    if (this.s[this.i]==='{') { const raw=this.rawGroup(); return {text:this.child(raw,math),raw,valid:raw.closed,start}; }
    const text=this.atom(math);
    return {text,start,valid:true};
  }
  optional() { this.whitespace(); if(this.s[this.i]!=='[') return null; const raw=this.rawGroup('[',']'); return {text:this.child(raw,true),raw,valid:raw.closed}; }
  preserveCommand(start, name, unsafe=false) {
    // Preserve arguments and option groups exactly. Unknown macros are not expanded.
    for (;;) {
      const before=this.i; this.whitespace();
      if (this.s[this.i]==='{' || this.s[this.i]==='[') { const open=this.s[this.i]; this.rawGroup(open,open==='{'?'}':']'); }
      else { this.i=before; break; }
    }
    this.ctx.stats.unsupportedCommands++;
    this.warn(unsafe?'NON_EXECUTED_COMMAND':'UNKNOWN_COMMAND',unsafe?`\\${name} was kept as text and was not executed.`:`Unsupported command \\${name} was preserved.`,start);
    return this.s.slice(start,this.i);
  }
  parse() {
    const parts=[];let column=0;
    const append=(value)=>{
      if(value.includes('\n')&&value!=='\n')value=alignContinuation(value,column);
      parts.push(value);
      const last=value.lastIndexOf('\n');
      column=last<0?column+codepointWidth(value):codepointWidth(value.slice(last+1));
    };
    while (this.i < this.s.length) {
      const start=this.i, c=this.s[this.i];
      if ((c==='^'||c==='_') && this.math) {
        this.i++;
        const arg=this.argument(true);
        if (!arg || !arg.valid) {append(this.s.slice(start,this.i));continue;}
        if (!parts.length || !parts.some(x=>x.trim())) this.warn('MISSING_SCRIPT_BASE','A script has no preceding base.',start);
        while(parts.length && /^[\t ]+$/.test(parts[parts.length-1])) column-=codepointWidth(parts.pop());
        append(script(arg.text,c,this.ctx,this.offset+start));
        continue;
      }
      append(this.atom(this.math));
      if (this.i <= start) { append(this.s[this.i++]); this.warn('RECOVERY','An unrecognized input character was retained.',start); }
    }
    return parts.join('');
  }
  atom(math=this.math) {
    if(this.depth+this.atomDepth>=this.ctx.maxDepth){
      this.warn('DEPTH_LIMIT','The nesting limit was reached; the remaining expression stays as LaTeX.');
      const rest=this.s.slice(this.i);this.i=this.s.length;return rest;
    }
    this.atomDepth++;
    try{return this.readAtom(math);}finally{this.atomDepth--;}
  }
  readAtom(math=this.math) {
    const start=this.i, c=this.s[this.i++];
    if (c==='{') {if(this.prose)return c;this.i--; const raw=this.rawGroup();return this.child(raw,math);}
    if (c==='}') {if(!this.prose)this.warn('UNMATCHED_GROUP','A closing brace has no matching opening brace and was retained.',start);return c;}
    if (c==='~') return '\u00A0';
    if (c!== '\\') return c || '';
    if (this.i>=this.s.length) {this.warn('TRAILING_BACKSLASH','A trailing backslash was retained.',start);return '\\';}
    if (!/[A-Za-z]/.test(this.s[this.i])) {
      const escaped=this.s[this.i++];
      if ('#$%&_{}'.includes(escaped)) return escaped;
      if (escaped==='\\') return '\n';
      if (escaped===' ') return ' ';
      if ([',',':',';'].includes(escaped)) return escaped===','?'\u2009':'\u2005';
      if (escaped==='!') return '';
      if (['(',')','[',']'].includes(escaped)) {this.warn('UNMATCHED_DELIMITER','An unmatched math delimiter was retained.',start);return '\\'+escaped;}
      const accent={"'":'\u0301','`':'\u0300','^':'\u0302','~':'\u0303','"':'\u0308','=':'\u0304','.':'\u0307'}[escaped];
      if(accent) {const a=this.argument(false);return a?this.accent(a.text,accent,start):this.s.slice(start,this.i);}
      this.warn('UNKNOWN_COMMAND',`Unsupported escape \\${escaped} was preserved.`,start); this.ctx.stats.unsupportedCommands++; return '\\'+escaped;
    }
    while(this.i<this.s.length && /[A-Za-z]/.test(this.s[this.i])) this.i++;
    const name=this.s.slice(start+1,this.i);
    // Keep source spacing readable in mixed paragraphs. Argument readers consume
    // separator spaces themselves; symbol commands must not glue prose words.
    if (SYMBOLS[name]) return SYMBOLS[name];
    if (FUNCTIONS.has(name)) return name + (/[\p{L}\p{N}\\]/u.test(this.s[this.i]||'')?' ':'');
    if (LAYOUT_COMMANDS.has(name)) return '';
    if (name==='quad') return '\u2003';
    if (name==='qquad') return '\u2003\u2003';
    if (['enspace','enskip'].includes(name)) return '\u2002';
    if (['thinspace','negthinspace'].includes(name)) return name==='thinspace'?'\u2009':'';
    if (['newline','linebreak','cr'].includes(name)) return '\n';
    if (name==='item') return '\n• ';
    if (['left','right','middle','big','Big','bigg','Bigg','bigl','bigr','Bigl','Bigr','biggl','biggr','Biggl','Biggr'].includes(name)) {
      this.whitespace(); if(this.s[this.i]==='.') {this.i++;return '';}
      if(this.i>=this.s.length){this.warn('MISSING_ARGUMENT','A delimiter sizing command is missing its delimiter.',start);return this.s.slice(start,this.i);}
      return this.atom(math);
    }
    if (name==='not') {this.whitespace();if(this.i>=this.s.length){this.warn('MISSING_ARGUMENT','The negation command is missing a relation.',start);return this.s.slice(start,this.i);}const a=this.atom(math);return NEGATIONS[a]||a+'\u0338';}
    if (['frac','dfrac','tfrac','cfrac'].includes(name)) {
      if(name==='cfrac' && this.s[this.i]==='[') this.optional();
      const a=this.argument(true), b=a?.valid?this.argument(true):null;
      if(!a?.valid||!b?.valid) return this.s.slice(start,this.i);
      const n=cleanMath(a.text), d=cleanMath(b.text);
      const common=VULGAR[n+'/'+d];
      if(common) return common;
      this.warn('FRACTION_LINEAR','A stacked fraction was represented as division with explicit grouping.',start,true);
      return groupIfNeeded(n)+'/'+groupIfNeeded(d);
    }
    if(name==='sqrt') {
      const index=this.optional(), a=this.argument(true);
      if(!a?.valid||index&&!index.valid) return this.s.slice(start,this.i);
      const radicand=cleanMath(a.text), n=index?cleanMath(index.text):'2';
      const root=n==='2'?'√':n==='3'?'∛':n==='4'?'∜':script(n,'^',this.ctx,this.offset+start)+'√';
      return root+groupIfNeeded(radicand);
    }
    if(['binom','dbinom','tbinom'].includes(name)) {
      const a=this.argument(true), b=a?.valid?this.argument(true):null;
      if(!a?.valid||!b?.valid)return this.s.slice(start,this.i);
      this.warn('BINOMIAL_LINEAR','A binomial coefficient uses an explicit “choose” representation.',start,true);
      return `(${cleanMath(a.text)} choose ${cleanMath(b.text)})`;
    }
    if (TEXT_COMMANDS.has(name)||STYLES[name]) {
      if(name==='operatorname' && this.s[this.i]==='*')this.i++;
      const a=this.argument(TEXT_COMMANDS.has(name)||name.startsWith('text')||name==='emph'?false:true);
      if(!a?.valid)return this.s.slice(start,this.i);
      return STYLES[name]?styled(a.text,STYLES[name],this.ctx,this.offset+start):a.text;
    }
    if (ACCENTS[name]) {const a=this.argument(true);return a?.valid?this.accent(a.text,ACCENTS[name],start,name):this.s.slice(start,this.i);}
    if (['overbrace','underbrace'].includes(name)) {
      const a=this.argument(true); if(!a?.valid)return this.s.slice(start,this.i);
      this.warn('ANNOTATION_LINEAR','A brace annotation was represented before its grouped expression.',start,true);
      return (name==='overbrace'?'⏞':'⏟')+`(${cleanMath(a.text)})`;
    }
    if(['overset','underset','stackrel'].includes(name)) {
      const a=this.argument(true), b=a?.valid?this.argument(true):null;
      if(!a?.valid||!b?.valid)return this.s.slice(start,this.i);
      this.warn('ANNOTATION_LINEAR','An above/below annotation uses an explicit labelled fallback.',start,true);
      return `${cleanMath(b.text)} [${name==='underset'?'below':'above'}: ${cleanMath(a.text)}]`;
    }
    if (name==='begin') return this.environment(start);
    if (name==='end') return this.preserveCommand(start,name);
    if (['pmod','pod'].includes(name)) {const a=this.argument(true);return a?.valid?`(${name==='pmod'?'mod ':''}${cleanMath(a.text)})`:this.s.slice(start,this.i);}
    if(['mod','bmod'].includes(name))return ' mod ';
    if(['textcolor','colorbox','fcolorbox'].includes(name)) {
      const color=this.argument(false), border=name==='fcolorbox'?this.argument(false):null, a=this.argument(math);
      if(!color?.valid||name==='fcolorbox'&&!border?.valid||!a?.valid)return this.s.slice(start,this.i);
      this.warn('STYLE_REMOVED','Color or box styling cannot be stored in plain Unicode text.',start,true);return a.text;
    }
    if (name==='color') {const a=this.argument(false);if(!a?.valid)return this.s.slice(start,this.i);this.warn('STYLE_REMOVED','Color styling cannot be stored in plain Unicode text.',start,true);return '';}
    if (name==='url') {this.whitespace();if(this.s[this.i]==='{'){const a=this.rawGroup();return a.closed?a.inner:a.raw;}return this.preserveCommand(start,name);}
    if (name==='href') {
      this.whitespace(); const url=this.rawGroup(), a=this.argument(false);
      if(!url?.closed||!a?.valid)return this.s.slice(start,this.i);
      this.warn('LINK_LINEAR','A hyperlink was represented as its label followed by its URL.',start,true);
      return `${a.text} (${url.inner})`;
    }
    if (name==='label') {const a=this.argument(false);if(!a?.valid)return this.s.slice(start,this.i);this.warn('METADATA_REMOVED','A LaTeX label was omitted from the visible text.',start);return '';}
    if(['ref','eqref','cite','citep','citet'].includes(name)) {const a=this.argument(false);if(!a?.valid)return this.s.slice(start,this.i);this.warn('UNRESOLVED_REFERENCE','A document reference cannot be resolved without its source document.',start);return `[${a.text}]`;}
    if(name==='tag') {if(this.s[this.i]==='*')this.i++;const a=this.argument(false);return a?.valid?` (${a.text})`:this.s.slice(start,this.i);}
    if(name==='nonumber'||name==='notag')return '';
    if(['hspace','vspace','kern','mkern'].includes(name)) {
      if(this.s[this.i]==='*')this.i++;
      if(this.s[this.i]==='{') {this.argument(false);this.warn('STYLE_REMOVED','TeX spacing was replaced with one space.',start,true);return ' ';}
      return this.preserveCommand(start,name);
    }
    return this.preserveCommand(start,name,UNSAFE.has(name));
  }
  accent(value, mark, start, name='accent') {
    const t=cleanMath(value);
    if(VECTOR_ACCENTS.has(name)){
      const label=name==='vec'||name==='overrightarrow'?'vec':name;
      if(this.ctx.vectorStyle==='label')return `${label}(${t})`;
      const chars=Array.from(t);let baseEnd=1;
      while(baseEnd<chars.length&&/\p{M}/u.test(chars[baseEnd]))baseEnd++;
      if(chars.length&&chars.slice(baseEnd).every(c=>SCRIPT_GLYPHS.has(c)))
        return (chars.slice(0,baseEnd).join('')+mark).normalize('NFC')+chars.slice(baseEnd).join('');
      this.warn('ACCENT_LINEAR','An arrow spanning several characters uses explicit vector notation because Unicode cannot span a whole expression.',start,true);
      return `${label}(${t})`;
    }
    if(['overline','underline'].includes(name)) return Array.from(t,c=>/\s/.test(c)?c:c+mark).join('');
    if(Array.from(t).filter(c=>!/\p{M}/u.test(c)).length===1)return (t+mark).normalize('NFC');
    this.warn('ACCENT_LINEAR','An accent over several characters was attached to an explicitly grouped expression.',start,true);
    return `(${t})${mark}`;
  }
  environment(start) {
    this.whitespace();const label=this.rawGroup();
    if(!label?.closed)return this.s.slice(start,this.i);
    const name=label.inner.trim();
    const contentStart=this.i;
    const re=/\\(begin|end)\s*\{([^{}]*)\}/g; re.lastIndex=this.i;
    const stack=[name]; let match, bodyEnd=-1, end=-1;
    while((match=re.exec(this.s))) {
      if(isEscaped(this.s,match.index))continue;
      if(match[1]==='begin')stack.push(match[2].trim());
      else if(match[2].trim()===stack[stack.length-1]) {stack.pop();if(!stack.length){bodyEnd=match.index;end=re.lastIndex;break;}}
    }
    if(end<0){this.i=this.s.length;this.warn('UNMATCHED_ENVIRONMENT',`The ${name} environment has no matching end and was retained.`,start);return this.s.slice(start);}
    this.i=end;
    if(!ENVIRONMENTS.has(name)){this.ctx.stats.unsupportedCommands++;this.warn('UNKNOWN_ENVIRONMENT',`The unsupported ${name} environment was preserved.`,start);return this.s.slice(start,end);}
    if(this.depth>=this.ctx.maxDepth){this.warn('DEPTH_LIMIT','The nesting limit was reached; this environment remains as LaTeX.',start);return this.s.slice(start,end);}
    let body=this.s.slice(contentStart,bodyEnd), bodyOffset=this.offset+contentStart;
    // The first array group specifies alignment, not mathematical content.
    if(name==='array'||name==='alignedat'||name.startsWith('alignat')) {
      const p=new Parser(body,this.ctx,bodyOffset,this.depth+1,true);p.whitespace();
      if(body[p.i]==='[')p.optional();p.whitespace();
      if(body[p.i]==='{'){p.rawGroup();bodyOffset+=p.i;body=body.slice(p.i);}
    }
    const rows=splitEnvironment(body);
    const converted=rows.map(row=>row.map(cell=>{
      let value=cleanMath(new Parser(cell.text,this.ctx,bodyOffset+cell.offset,this.depth+1,true,false,true).parse());
      if(value.includes('\n')){this.warn('MULTILINE_CELL_LINEAR','A multiline expression inside a matrix cell uses explicit line separators.',start,true);value=value.replace(/\n/g,' ↵ ');}
      return value;
    }));
    // Ignore a final row terminator, but retain explicitly empty matrix cells.
    if(converted.length>1&&converted.at(-1).length===1&&!converted.at(-1)[0])converted.pop();
    if(converted.length===1&&converted[0].length===1&&!converted[0][0])return '';
    if(!['matrix','pmatrix','bmatrix','Bmatrix','vmatrix','Vmatrix','smallmatrix','array','cases','dcases'].includes(name)) return converted.map(row=>row.join(' ').replace(/ +/g,' ').trim()).join('\n');
    if(this.ctx.matrixStyle==='compact'&&!['cases','dcases'].includes(name)){
      const brackets={pmatrix:['(',')'],bmatrix:['[',']'],Bmatrix:['{','}'],vmatrix:['|','|'],Vmatrix:['||','||']}[name]||['[',']'];
      // A column vector is the transpose of a comma-separated row vector.
      // Determinant and norm delimiters retain their original row layout.
      const columnVector=converted.length>1&&converted.every(row=>row.length===1)&&!['vmatrix','Vmatrix'].includes(name);
      const content=columnVector?converted.map(row=>row[0]).join(', '):converted.map(row=>row.join(', ')).join('; ');
      return brackets[0]+content+brackets[1]+(columnVector?'ᵀ':'');
    }
    if(this.inMatrix){
      this.warn('NESTED_MATRIX_LINEAR','A matrix within another matrix uses explicit rows and columns to keep each cell unambiguous.',start,true);
      const content=converted.map(row=>'['+row.join(', ')+']').join('; ');
      const brackets={pmatrix:['(',')'],bmatrix:['[',']'],Bmatrix:['{','}'],vmatrix:['|','|'],Vmatrix:['‖','‖'],cases:['cases{','}'],dcases:['cases{','}']}[name]||['[',']'];
      return brackets[0]+content+brackets[1];
    }
    this.warn('MATRIX_MULTILINE','Rows and columns use a multiline plain-text layout; alignment depends on the receiving font.',start,true);
    const columns=Math.max(...converted.map(row=>row.length));
    if(converted.some(row=>row.length!==columns))this.warn('MATRIX_COLUMN_COUNT','Matrix rows have different column counts; missing cells were kept empty.',start);
    for(const row of converted)while(row.length<columns)row.push('');
    const widths=[];for(const row of converted)row.forEach((cell,j)=>{widths[j]=Math.max(widths[j]||0,codepointWidth(cell));});
    const lines=converted.map(row=>row.map((cell,j)=>cell+' '.repeat(Math.max(0,(widths[j]||0)-codepointWidth(cell)))).join('  '));
    if(name==='cases'||name==='dcases') return lines.map((line,j)=>`${lines.length===1?'{':j===0?'⎧':j===lines.length-1?'⎩':'⎪'} ${line.trimEnd()}`).join('\n');
    const braces={pmatrix:['⎛','⎜','⎝','⎞','⎟','⎠','(',')'],bmatrix:['⎡','⎢','⎣','⎤','⎥','⎦','[',']'],Bmatrix:['⎧','⎪','⎩','⎫','⎪','⎭','{','}'],vmatrix:['│','│','│','│','│','│','|','|'],Vmatrix:['║','║','║','║','║','║','‖','‖']}[name];
    if(!braces)return lines.map(line=>line.trimEnd()).join('\n');
    if(lines.length===1)return `${braces[6]} ${lines[0]} ${braces[7]}`;
    return lines.map((line,j)=>`${braces[j===0?0:j===lines.length-1?2:1]} ${line} ${braces[j===0?3:j===lines.length-1?5:4]}`).join('\n');
  }
}

function splitEnvironment(body) {
  const rows=[];let row=[],cellStart=0,braceDepth=0,envDepth=0,i=0;
  const cell=(end)=>{row.push({text:body.slice(cellStart,end),offset:cellStart});};
  while(i<body.length) {
    if(body[i]==='\\') {
      const env=/^\\(begin|end)\s*\{[^{}]*\}/.exec(body.slice(i));
      if(env){envDepth+=env[1]==='begin'?1:-1;i+=env[0].length;continue;}
      if(braceDepth===0&&envDepth===0&&(body[i+1]==='\\'||/^\\cr\b/.test(body.slice(i)))) {
        cell(i);rows.push(row);row=[];i+=body[i+1]==='\\'?2:3;
        const spacing=/^\s*\[[^\]]*\]/.exec(body.slice(i));if(spacing)i+=spacing[0].length;
        cellStart=i;continue;
      }
      i+=Math.min(2,body.length-i);continue;
    }
    if(body[i]==='{')braceDepth++;
    else if(body[i]==='}')braceDepth=Math.max(0,braceDepth-1);
    else if(body[i]==='&'&&braceDepth===0&&envDepth===0){cell(i);cellStart=i+1;}
    i++;
  }
  cell(body.length);rows.push(row);return rows;
}

function closeDelimiter(input, from, closing) {
  for(let i=from;i<input.length;i++) {
    if(input.startsWith(closing,i)&&!isEscaped(input,i)) {
      return i;
    }
  }
  return -1;
}

function currencyDollar(input, index) {
  const number=/^\d+(?:[.,]\d+)*/.exec(input.slice(index+1));
  if(!number)return false;
  const rest=input.slice(index+1+number[0].length);
  if(rest.startsWith('$')||/^\s*[-+*/=<>^_\\×÷]/.test(rest))return false;
  return !rest||/^[\s.,;:!?\])}]/.test(rest);
}

// Markdown code is copied literally. Only prose and math around it are converted.
function markdownPieces(input) {
  const pieces=[];let i=0,start=0;
  const push=(end,protectedCode)=>{if(end>start)pieces.push({text:input.slice(start,end),offset:start,protectedCode});start=end;};
  while(i<input.length) {
    // Do not mistake backticks inside a delimited equation for Markdown.
    let opening='',closing='';
    if(!isEscaped(input,i)){
      if(input.startsWith('$$',i)){opening='$$';closing='$$';}
      else if(input[i]==='$'&&!currencyDollar(input,i)){opening='$';closing='$';}
      else if(input.startsWith('\\(',i)){opening='\\(';closing='\\)';}
      else if(input.startsWith('\\[',i)){opening='\\[';closing='\\]';}
    }
    if(opening){const end=closeDelimiter(input,i+opening.length,closing);if(end>=0){i=end+closing.length;continue;}}
    const urlBoundary=i===0||/\s/.test(input[i-1])||['(','[','"',"'"].includes(input[i-1]);
    const url=urlBoundary?/^(?:https?:\/\/|www\.)[^\s<>"']+/i.exec(input.slice(i)):null;
    if(url){push(i,false);push(i+url[0].length,true);i+=url[0].length;continue;}
    const lineStart=i===0||input[i-1]==='\n';
    const fence=lineStart?/^[ \t]{0,3}(`{3,}|~{3,})[^\n]*(?:\n|$)/.exec(input.slice(i)):null;
    if(fence){
      push(i,false);
      const delimiter=fence[1], closingFence=new RegExp(`^[ \\t]{0,3}${delimiter[0]}{${delimiter.length},}[ \\t]*(?:\\n|$)`,'gm');
      closingFence.lastIndex=i+fence[0].length;
      const match=closingFence.exec(input);const end=match?match.index+match[0].length:input.length;
      push(end,true);i=end;continue;
    }
    if(input[i]==='`'&&!isEscaped(input,i)){
      let endRun=i+1;while(input[endRun]==='`')endRun++;
      const marker=input.slice(i,endRun);let end=input.indexOf(marker,endRun);
      while(end>=0&&(input[end-1]==='`'||input[end+marker.length]==='`'))end=input.indexOf(marker,end+marker.length);
      if(end>=0){push(i,false);push(end+marker.length,true);i=end+marker.length;continue;}
      i=endRun;continue;
    }
    i++;
  }
  push(input.length,false);return pieces;
}

function mixed(input, ctx, offset=0, mathOutside=false) {
  const chunks=[];let outside=0,i=0;
  while(i<input.length) {
    if(isEscaped(input,i)){i++;continue;}
    let opening='',closing='';
    if(input.startsWith('$$',i)){opening='$$';closing='$$';}
    else if(input[i]==='$'&&!currencyDollar(input,i)){opening='$';closing='$';}
    else if(input.startsWith('\\(',i)){opening='\\(';closing='\\)';}
    else if(input.startsWith('\\[',i)){opening='\\[';closing='\\]';}
    if(!opening){i++;continue;}
    chunks.push(new Parser(input.slice(outside,i),ctx,offset+outside,0,mathOutside,!mathOutside).parse());
    const end=closeDelimiter(input,i+opening.length,closing);
    if(end<0){warning(ctx,'UNMATCHED_DELIMITER',`The opening ${opening} has no matching ${closing}; the remaining input was retained.`,offset+i);chunks.push(input.slice(i));return chunks.join('');}
    ctx.stats.mathSegments++;
    const converted=cleanMath(new Parser(input.slice(i+opening.length,end),ctx,offset+i+opening.length,0,true).parse());
    const prefix=chunks.join('').split('\n').at(-1);
    chunks.push(alignContinuation(converted,codepointWidth(prefix)));
    i=end+closing.length;outside=i;
  }
  chunks.push(new Parser(input.slice(outside),ctx,offset+outside,0,mathOutside,!mathOutside).parse());
  return chunks.join('');
}

/** Convert mixed text / LaTeX to an honest plain-text Unicode representation. */
export function convertLatex(input, options={}) {
  if(typeof input!=='string')throw new TypeError('The input must be a string.');
  const mode=['auto','math','text'].includes(options.mode)?options.mode:'auto';
  const requestedLength=Number(options.maxInputLength), requestedDepth=Number(options.maxDepth);
  const maxInputLength=Number.isFinite(requestedLength)?Math.min(200000,Math.max(1,Math.floor(requestedLength))):50000;
  const maxDepth=Number.isFinite(requestedDepth)?Math.min(128,Math.max(1,Math.floor(requestedDepth))):48;
  const ctx={maxDepth,matrixStyle:options.matrixStyle==='compact'?'compact':'multiline',vectorStyle:options.vectorStyle==='label'?'label':'arrow',warnings:[],additionalWarnings:0,stats:{inputCharacters:Array.from(input).length,outputCharacters:0,mathSegments:0,unsupportedCommands:0,lossyConversions:0}};
  if(input.length>maxInputLength){warning(ctx,'INPUT_TOO_LONG',`The input exceeds the ${maxInputLength}-character conversion limit. It was returned unchanged.`,0);ctx.stats.outputCharacters=ctx.stats.inputCharacters;return {text:input,warnings:ctx.warnings,stats:ctx.stats};}
  let text;
  if(mode==='math'){text=cleanMath(mixed(input,ctx,0,true));if(!ctx.stats.mathSegments&&input.trim())ctx.stats.mathSegments=1;}
  else text=markdownPieces(input).map(piece=>{
    if(piece.protectedCode)return piece.text;
    const hasDelimiters=/(?<!\\)(?:\$|\\\(|\\\[)/.test(piece.text);
    const mathCommands=Array.from(piece.text.matchAll(/\\([A-Za-z]+)/g),m=>m[1]);
    const looksMath=mathCommands.some(name=>SYMBOLS[name]||FUNCTIONS.has(name)||ACCENTS[name]||name.startsWith('math')||['frac','dfrac','tfrac','cfrac','sqrt','sum','prod','coprod','int','iint','iiint','oint','begin','binom','not','left','right','boldsymbol','bm'].includes(name))||/(?:^|[\s=+\-*/(])[\p{L}\p{N}][_^](?:\{|[\p{L}\p{N}])/u.test(piece.text);
    if(mode==='auto'&&!hasDelimiters&&looksMath){ctx.stats.mathSegments++;return new Parser(piece.text,ctx,piece.offset,0,true,true).parse();}
    return mixed(piece.text,ctx,piece.offset);
  }).join('');
  if(ctx.additionalWarnings)ctx.warnings.push({code:'ADDITIONAL_WARNINGS',message:`${ctx.additionalWarnings} further warnings were omitted.`});
  ctx.stats.outputCharacters=Array.from(text).length;
  return {text,warnings:ctx.warnings,stats:ctx.stats};
}

export const supportedCommands = Object.freeze([...new Set([...Object.keys(SYMBOLS),...FUNCTIONS,...Object.keys(STYLES),...TEXT_COMMANDS,...Object.keys(ACCENTS),'frac','dfrac','tfrac','cfrac','sqrt','binom','dbinom','tbinom','begin','end','left','right','middle','not','overbrace','underbrace','overset','underset','stackrel','pmod','mod','bmod','textcolor','color','href','url'])].sort());
