#!/usr/bin/env node
// Builds the SVGs whose content only changes when this file changes:
// hero, portfolio link, project cards and tech stack. Output goes to assets/
// and is committed, so these images never depend on a running workflow.
// Usage: node scripts/build-static-assets.mjs   (needs network for icons)
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { esc, seededRandom, svgDoc, textWidth, variants, wrap } from './lib/svg-kit.mjs';

const OUT_DIR = fileURLToPath(new URL('../assets/', import.meta.url));

// ---------------------------------------------------------------- content
const NAME = 'Đỗ Tuấn Anh';
const ROLE = 'Full-Stack Developer';
const TAGLINE = 'I build web and mobile apps, and the backends behind them.';
const PORTFOLIO = 'dta.io.vn';

// Work is private for now, so cards describe it without naming repos.
const PROJECTS = [
  { path: '~/work/exam-platform', title: 'Exam & LMS Platform', desc: 'REST API, web app, admin dashboard, LMS and an automated scoring service.', tags: ['TypeScript', 'Node.js', 'Python'] },
  { path: '~/work/mobile', title: 'Mobile Apps', desc: 'Cross-platform Flutter apps on a shared clean-architecture base.', tags: ['Flutter', 'Dart'] },
  { path: '~/work/booking', title: 'Booking System', desc: 'Room, shift and sports-field booking with an admin panel.', tags: ['TypeScript', 'Java', 'Spring'] },
  { path: '~/work/automation', title: 'Dev Automation', desc: 'Deploy pipelines, docs tooling and AI coding workflows.', tags: ['Shell', 'Python', 'Actions'] },
];

// simple-icons slugs (CC0, single-path brand marks), pinned for stable builds.
const ICONS_VERSION = '16.33.0';
const STACK = [
  ['typescript', 'TypeScript'], ['javascript', 'JavaScript'], ['react', 'React'], ['nextdotjs', 'Next.js'], ['tailwindcss', 'Tailwind'],
  ['flutter', 'Flutter'], ['dart', 'Dart'], ['nodedotjs', 'Node.js'], ['express', 'Express'], ['python', 'Python'],
  ['openjdk', 'Java'], ['spring', 'Spring'], ['postgresql', 'PostgreSQL'], ['mongodb', 'MongoDB'], ['mysql', 'MySQL'],
  ['redis', 'Redis'], ['docker', 'Docker'], ['nginx', 'Nginx'], ['githubactions', 'Actions'], ['vercel', 'Vercel'],
];

const RISE_CSS = '@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
const isWide = (w) => w >= 600;

// ------------------------------------------------------------------- hero
// Each letter of the name "decodes": random glyphs flash in place, then the
// real letter locks in, left to right. Without CSS animation only the final
// letters render.
function hero(t, w) {
  const wide = isWide(w);
  const size = wide ? 72 : 40;
  const roleSize = wide ? 30 : 22;
  const tagSize = wide ? 20 : 17;
  const promptSize = wide ? 18 : 15;
  const adv = size * 0.6;
  const baseY = promptSize + 14 + size * 1.05;
  const roleY = baseY + roleSize * 1.8;
  const tagLines = wrap(TAGLINE, Math.floor(w / (tagSize * 0.6)));
  const tagY = roleY + tagSize * 2;

  const rand = seededRandom(20210729);
  const glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&*<>/';
  const start = 0.3;
  const tick = 0.06;
  const parts = [];
  [...NAME].forEach((ch, i) => {
    if (ch === ' ') return;
    const x = (i * adv).toFixed(1);
    const settle = start + 0.45 + i * 0.07;
    for (let f = start; f < settle; f += tick) {
      const g = glyphs[Math.floor(rand() * glyphs.length)];
      parts.push(`<text class="frame motion-only" x="${x}" y="${baseY}" style="animation-delay:${f.toFixed(2)}s">${esc(g)}</text>`);
    }
    parts.push(`<text class="ch" x="${x}" y="${baseY}" style="animation-duration:${settle.toFixed(2)}s">${esc(ch)}</text>`);
  });

  const done = start + 0.45 + NAME.length * 0.07;
  const css = `
.name text{font-size:${size}px;font-weight:800}
.frame{fill:${t.accent};visibility:hidden;animation:flash ${tick}s step-end}
.ch{fill:${t.fg};animation:hold 1s step-end}
@keyframes flash{0%,100%{visibility:visible}}
@keyframes hold{0%,100%{visibility:hidden}}
.cursor{animation:blink 1.1s step-end infinite ${done.toFixed(2)}s}
@keyframes blink{50%{opacity:0}}
.rise{animation:rise .6s cubic-bezier(.2,.7,.2,1) both}${RISE_CSS}`;

  const tags = tagLines.map((line, i) => `<text class="rise" style="animation-delay:${(done + 0.15).toFixed(2)}s" x="0" y="${(tagY + i * tagSize * 1.45).toFixed(1)}" font-size="${tagSize}" fill="${t.muted}">${esc(line)}</text>`).join('');
  const body = `<text x="0" y="${promptSize + 4}" font-size="${promptSize}" fill="${t.muted}">~/dotuananhtb <tspan fill="${t.accent}">$</tspan> ./intro.sh</text>
<g class="name">${parts.join('')}</g>
<rect class="cursor" x="${(NAME.length * adv + size * 0.14).toFixed(1)}" y="${(baseY - size * 0.78).toFixed(1)}" width="${(size * 0.42).toFixed(1)}" height="${(size * 0.89).toFixed(1)}" fill="${t.accent}"/>
<text class="rise" style="animation-delay:${done.toFixed(2)}s" x="0" y="${roleY.toFixed(1)}" font-size="${roleSize}" font-weight="700" fill="${t.accent}">${esc(ROLE)}</text>
${tags}`;

  const height = tagY + (tagLines.length - 1) * tagSize * 1.45 + tagSize * 0.6;
  return svgDoc({ width: w, height, label: `${NAME}, ${ROLE}. ${TAGLINE}`, css, body });
}

// ------------------------------------------------------- portfolio link
function portfolio(t, w) {
  const wide = isWide(w);
  const h = wide ? 72 : 60;
  const size = wide ? 22 : 16;
  const btnSize = wide ? 19 : 16;
  const label = wide ? 'Portfolio' : 'Visit';
  const btnW = textWidth(`${label} →`, btnSize) + (wide ? 50 : 32);
  const bx = w - btnW - 12;
  const textY = h / 2 + size * 0.35;
  const btnY = h / 2 + btnSize * 0.35;
  const css = `.arrow{animation:nudge 1.6s ease-in-out infinite}@keyframes nudge{50%{transform:translateX(4px)}}`;
  const body = `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="10" fill="${t.surface}" stroke="${t.faint}"/>
<text x="${wide ? 24 : 16}" y="${textY.toFixed(1)}" font-size="${size}" fill="${t.muted}"><tspan fill="${t.accent}">$</tspan> open <tspan fill="${t.accent2}" font-weight="700">https://${PORTFOLIO}</tspan></text>
<rect x="${bx.toFixed(1)}" y="12" width="${btnW.toFixed(1)}" height="${h - 24}" rx="8" fill="${t.accent}"/>
<text x="${(bx + btnW / 2 - textWidth(`${label} →`, btnSize) / 2).toFixed(1)}" y="${btnY.toFixed(1)}" font-size="${btnSize}" font-weight="700" fill="${t.onAccent}">${label} <tspan class="arrow">→</tspan></text>`;
  return svgDoc({ width: w, height: h, label: `Open portfolio at ${PORTFOLIO}`, css, body });
}

// --------------------------------------------------------- project cards
function lockIcon(x, y, color) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="1.6"><rect x="0.8" y="5.5" width="10.4" height="7.5" rx="1.5"/><path d="M3 5.5V3.8a3 3 0 0 1 6 0v1.7"/></g>`;
}

function projects(t, w) {
  const cols = isWide(w) ? 2 : 1;
  const gap = 16;
  const cw = (w - gap * (cols - 1)) / cols;
  const pad = 24;
  const descSize = 18;
  const maxChars = Math.floor((cw - pad * 2) / (descSize * 0.6));
  const wrapped = PROJECTS.map((p) => wrap(p.desc, maxChars));
  const maxLines = Math.max(...wrapped.map((l) => l.length));
  const chipsY = 114 + (maxLines - 1) * 26 + 20;
  const ch = chipsY + 28 + 22;

  const cards = PROJECTS.map((p, i) => {
    const x = (i % cols) * (cw + gap);
    const y = Math.floor(i / cols) * (ch + gap);
    const desc = wrapped[i].map((line, j) => `<text x="${x + pad}" y="${y + 114 + j * 26}" font-size="${descSize}" fill="${t.muted}">${esc(line)}</text>`).join('');
    let cx = x + pad;
    const tags = p.tags.map((tag) => {
      const tw = textWidth(tag, 15) + 20;
      const chip = `<rect x="${cx}" y="${y + chipsY}" width="${tw}" height="28" rx="6" fill="none" stroke="${t.faint}"/><text x="${cx + 10}" y="${y + chipsY + 19}" font-size="15" fill="${t.accent2}">${esc(tag)}</text>`;
      cx += tw + 8;
      return chip;
    }).join('');
    const pillW = 98;
    const px = x + cw - pad - pillW;
    return `<g class="card" style="animation-delay:${(0.08 * i).toFixed(2)}s">
<rect x="${x + 0.5}" y="${y + 0.5}" width="${cw - 1}" height="${ch - 1}" rx="10" fill="${t.surface}" stroke="${t.faint}"/>
<text x="${x + pad}" y="${y + 40}" font-size="15" fill="${t.muted}">${esc(p.path)}</text>
<rect x="${px}" y="${y + 20}" width="${pillW}" height="28" rx="14" fill="none" stroke="${t.faint}"/>${lockIcon(px + 14, y + 26, t.muted)}<text x="${px + 34}" y="${y + 39}" font-size="14" fill="${t.muted}">private</text>
<text x="${x + pad}" y="${y + 82}" font-size="24" font-weight="700" fill="${t.fg}">${esc(p.title)}</text>
${desc}${tags}</g>`;
  }).join('\n');

  const rows = Math.ceil(PROJECTS.length / cols);
  const css = `.card{animation:rise .5s cubic-bezier(.2,.7,.2,1) both}${RISE_CSS}`;
  return svgDoc({ width: w, height: rows * ch + (rows - 1) * gap, label: `Projects: ${PROJECTS.map((p) => p.title).join(', ')}`, css, body: cards });
}

// ------------------------------------------------------------- tech stack
async function fetchIcons() {
  return Promise.all(STACK.map(async ([slug, label]) => {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@${ICONS_VERSION}/icons/${slug}.svg`);
    if (!res.ok) throw new Error(`Icon ${slug} failed: ${res.status}`);
    const path = (await res.text()).match(/<path d="([^"]+)"/)?.[1];
    if (!path) throw new Error(`Icon ${slug} has no path`);
    return { label, path };
  }));
}

// Monochrome marks in an even grid keep twenty logos calm and legible.
function stack(t, w, icons) {
  const cols = isWide(w) ? 5 : 4;
  const cellW = w / cols;
  const cellH = 92;
  const icon = 34;
  const cells = icons.map(({ label, path }, i) => {
    const cx = (i % cols) * cellW + cellW / 2;
    const y = Math.floor(i / cols) * cellH;
    return `<g class="cell" style="animation-delay:${(0.03 * i).toFixed(2)}s"><path transform="translate(${(cx - icon / 2).toFixed(1)} ${y + 8}) scale(${(icon / 24).toFixed(4)})" d="${path}" fill="${t.fg}"/><text x="${cx.toFixed(1)}" y="${y + 70}" text-anchor="middle" font-size="15" fill="${t.muted}">${esc(label)}</text></g>`;
  }).join('\n');
  const rows = Math.ceil(icons.length / cols);
  const css = '.cell{animation:fade .4s ease-out both}@keyframes fade{from{opacity:0}to{opacity:1}}';
  return svgDoc({ width: w, height: rows * cellH - 8, label: `Tech stack: ${icons.map((i) => i.label).join(', ')}`, css, body: cells });
}

// ------------------------------------------------------------------- main
mkdirSync(OUT_DIR, { recursive: true });
const icons = await fetchIcons();
const builders = { hero, portfolio, projects, stack: (t, w) => stack(t, w, icons) };
for (const [name, render] of Object.entries(builders)) {
  for (const { file, svg } of variants(render)) writeFileSync(`${OUT_DIR}${name}-${file}`, svg);
}
console.log(`Wrote static assets to ${OUT_DIR}`);
