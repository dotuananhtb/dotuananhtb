// Shared building blocks for the profile SVGs: theme tokens, the embedded
// JetBrains Mono font, and a document wrapper. Every SVG is rendered per
// theme (dark/light) and per layout (wide/narrow) so README.md can pick the
// right one with <picture> media queries.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Layouts: "wide" fills the README column on desktop; "narrow" is drawn for
// phones (~343px column) so small text stays readable without zooming.
export const LAYOUTS = { wide: 720, narrow: 400 };

// Colors follow GitHub's own palettes so images sit natively on the page.
export const THEMES = {
  dark: {
    fg: '#e6edf3', muted: '#7d8590', faint: '#30363d', surface: '#161b22',
    accent: '#7ee787', accent2: '#79c0ff', onAccent: '#0d1117', snake: '#a371f7',
    levels: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  },
  light: {
    fg: '#1f2328', muted: '#59636e', faint: '#d0d7de', surface: '#f6f8fa',
    accent: '#1a7f37', accent2: '#0969da', onAccent: '#ffffff', snake: '#8250df',
    levels: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  },
};

// JetBrains Mono advances exactly 0.6em per glyph, which lets layouts measure text.
export const CHAR_EM = 0.6;
export const textWidth = (text, size) => [...text].length * size * CHAR_EM;

const fontPath = fileURLToPath(new URL('../../assets/fonts/jetbrains-mono-subset.woff', import.meta.url));
const FONT_CSS = `@font-face{font-family:'JBM';font-weight:100 800;src:url(data:font/woff;base64,${readFileSync(fontPath).toString('base64')}) format('woff')}`;
export const FONT_FAMILY = "'JBM', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Motion is opt-out: viewers who ask for reduced motion get the final frame,
// and elements that only exist for the animation are hidden.
const BASE_CSS = `text{font-family:${FONT_FAMILY}}@media (prefers-reduced-motion: reduce){*{animation:none!important}.motion-only{display:none}}`;

export function svgDoc({ width, height, label, css = '', body }) {
  const h = Math.ceil(height);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" role="img" aria-label="${esc(label)}">
<style>${FONT_CSS}${BASE_CSS}${css}</style>
${body}
</svg>
`;
}

// Deterministic PRNG so rebuilding the static assets produces identical files.
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

// Greedy word wrap for monospace text within `maxChars` per line.
export function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export const fmt = (n) => n.toLocaleString('en-US');

// Writes one SVG per theme and layout: `<name>-<theme>[-narrow].svg`.
export function variants(render) {
  const out = [];
  for (const [themeName, theme] of Object.entries(THEMES)) {
    for (const [layout, width] of Object.entries(LAYOUTS)) {
      const suffix = layout === 'narrow' ? '-narrow' : '';
      out.push({ file: `${themeName}${suffix}.svg`, svg: render(theme, width) });
    }
  }
  return out;
}
