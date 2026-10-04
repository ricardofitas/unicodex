# Unicodex

Convert a LaTeX formula or a paragraph mixing prose and math into **copyable Unicode plain text**. Everything runs in your browser. No API, account, model, key, network request, or payment is needed for conversion.

**Live app:** https://projecthub.ricardofitas.com/unicodex

## Use

Paste text into the left editor. The right editor updates automatically. Click **Copy Unicode** to copy exactly the output shown. You can also select the output and copy it manually.

- **Automatic:** mixed text with `$…$`, `$$…$$`, `\(…\)`, `\[…\]`, plus unwrapped LaTeX commands.
- **Formula only:** interpret the input as math.
- **Text:** preserve normal prose and interpret only explicitly delimited math and known text commands.

The examples cover paragraphs, fractions, roots, matrices, vectors, mathematical alphabets, integrals, sums, products and aligned equations. Review the conversion notes when a layout or character cannot be reproduced exactly.

## Unicode limits

This is a text converter, not a TeX typesetter. Unicode cannot express every LaTeX layout or font. Fractions use grouping and `/`; matrices use aligned text and line breaks; unavailable superscripts/subscripts retain explicit `^(…)` / `_(…)` notation. Unknown commands and malformed content remain visible with a warning instead of being silently erased. Mathematical meaning still needs checking for unsupported notation.

Currency dollar signs are inherently ambiguous with TeX delimiters. Escape them as `\$` or use Text mode. Custom macro expansion, package execution and arbitrary TeX are intentionally unsupported. Input is limited to 100,000 UTF-16 code units; recursion is bounded. Fonts and the destination app determine how mathematical Unicode glyphs display. Paste matrices into a monospaced plain-text field to retain column alignment.

## Run locally

Requires Node.js 20 or newer; no dependencies to install.

```sh
npm start
# http://localhost:3000
npm test
npm run check
npm run build
```

`dist/` contains the static app for any HTTPS static host. Keep all its files together. Clipboard access requires a secure context (HTTPS or localhost); the app falls back to selected-text copying when necessary.

## Engine API

```js
import { convertLatex } from './converter.js';
const { text, warnings, stats } = convertLatex('Energy: $E=mc^2$.');
// text: 'Energy: E=mc².'
```

Options: `mode` (`auto`, `math`, `text`), `maxInputLength`, `maxDepth`. Warnings expose a code, message and optional source offset. The engine has no DOM dependency and can run in Node.js or the browser.

## ProjectHub integration

The ProjectHub card links to `/unicodex`. It serves this same standalone interface using local copies of the assets under `/unicodex-app/`, without a third-party embed. The public repository is the source for the app; the vendored ProjectHub snapshot records its source commit and hashes in `public/unicodex-app/SOURCE.json`.

MIT licensed. See [LICENSE](LICENSE).
