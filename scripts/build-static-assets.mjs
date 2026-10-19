#!/usr/bin/env node
// Builds the SVGs whose content only changes when this file changes:
// hero, portfolio link, project cards, tech stack and AI agents. Output goes to assets/
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
// A `featured` card spans the full width on desktop.
const PROJECTS = [
  { path: '~/work/ai-features', title: 'AI Learning Features', featured: true, desc: 'Speech and pronunciation scoring on ONNX, LLM feedback with OpenAI and Anthropic, semantic search on Qdrant, and a real-time voice tutor.', tags: ['Python', 'FastAPI', 'ONNX', 'Qdrant', 'LiveKit'] },
  { path: '~/work/exam-platform', title: 'Exam & LMS Platform', desc: 'REST API, web app, admin dashboard, LMS and an automated scoring service.', tags: ['TypeScript', 'Node.js', 'Python'] },
  { path: '~/work/mobile', title: 'Mobile Apps', desc: 'Cross-platform Flutter apps on a shared clean-architecture base.', tags: ['Flutter', 'Dart'] },
  { path: '~/work/booking', title: 'Booking System', desc: 'Room, shift and sports-field booking with an admin panel.', tags: ['TypeScript', 'Java', 'Spring'] },
  { path: '~/work/automation', title: 'Dev Automation', desc: 'Deploy pipelines, docs tooling and AI coding workflows.', tags: ['Shell', 'Python', 'Actions'] },
];

// simple-icons slugs (CC0, single-path brand marks), pinned for stable builds.
// A string instead of a slug draws a monogram tile for marks the set lacks.
const ICONS_VERSION = '16.33.0';
const STACK_GROUPS = [
  ['web', [['typescript', 'TypeScript'], ['javascript', 'JavaScript'], ['react', 'React'], ['nextdotjs', 'Next.js'], ['tailwindcss', 'Tailwind'], ['shadcnui', 'shadcn/ui'], ['reactquery', 'TanStack']]],
  ['server', [['nodedotjs', 'Node.js'], ['express', 'Express'], ['python', 'Python'], ['fastapi', 'FastAPI'], ['openjdk', 'Java'], ['spring', 'Spring'], ['socketdotio', 'Socket.IO']]],
  ['mobile', [['flutter', 'Flutter'], ['dart', 'Dart'], ['firebase', 'Firebase']]],
  ['data & ai', [['postgresql', 'PostgreSQL'], ['mongodb', 'MongoDB'], ['redis', 'Redis'], ['qdrant', 'Qdrant'], [{ mono: 'AI' }, 'OpenAI'], ['anthropic', 'Anthropic'], ['onnx', 'ONNX']]],
  ['ops', [['docker', 'Docker'], ['nginx', 'Nginx'], ['githubactions', 'Actions'], ['vercel', 'Vercel'], ['vitest', 'Vitest'], [{ mono: 'PW' }, 'Playwright'], ['livekit', 'LiveKit']]],
];

// AI coding agents in daily use, listed without ranking.
const AGENTS = [
  ['claude', 'Claude Code', 'CLI'],
  [{ mono: '>_' }, 'Codex', 'CLI'],
  ['googlegemini', 'Gemini', 'CLI'],
  ['githubcopilot', 'Copilot', 'CLI'],
  [{ mono: 'AG' }, 'Antigravity', 'IDE'],
];
const AGENT_WORKFLOW = [
  'Parallel agents in isolated git worktrees, run side by side from one terminal.',
  'Custom MCP servers that connect agents to task tracking and team docs.',
  'Reusable skill kits that take work from plan to build, test, review and ship.',
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

const CHIP_ROW = 36;

// Lays tags out left to right, starting a new row when one would overflow.
function chipRows(tags, maxW) {
  const rows = [[]];
  let used = 0;
  for (const tag of tags) {
    const w = textWidth(tag, 15) + 20;
    if (used > 0 && used + w > maxW) {
      rows.push([]);
      used = 0;
    }
    rows.at(-1).push({ tag, w });
    used += w + 8;
  }
  return rows;
}

function card(t, p, x, y, cw, ch, lines, chipsY, i) {
  const pad = 24;
  const desc = lines.map((line, j) => `<text x="${x + pad}" y="${y + 114 + j * 26}" font-size="18" fill="${t.muted}">${esc(line)}</text>`).join('');
  const tags = chipRows(p.tags, cw - pad * 2).map((row, r) => {
    let cx = x + pad;
    const cy = y + chipsY + r * CHIP_ROW;
    return row.map(({ tag, w }) => {
      const chip = `<rect x="${cx}" y="${cy}" width="${w}" height="28" rx="6" fill="none" stroke="${t.faint}"/><text x="${cx + 10}" y="${cy + 19}" font-size="15" fill="${t.accent2}">${esc(tag)}</text>`;
      cx += w + 8;
      return chip;
    }).join('');
  }).join('');
  const pillW = 98;
  const px = x + cw - pad - pillW;
  // The featured card gets the accent outline so it reads first.
  const stroke = p.featured ? t.accent : t.faint;
  return `<g class="card" style="animation-delay:${(0.08 * i).toFixed(2)}s">
<rect x="${x + 0.5}" y="${y + 0.5}" width="${cw - 1}" height="${ch - 1}" rx="10" fill="${t.surface}" stroke="${stroke}"/>
<text x="${x + pad}" y="${y + 40}" font-size="15" fill="${t.muted}">${esc(p.path)}</text>
<rect x="${px}" y="${y + 20}" width="${pillW}" height="28" rx="14" fill="none" stroke="${t.faint}"/>${lockIcon(px + 14, y + 26, t.muted)}<text x="${px + 34}" y="${y + 39}" font-size="14" fill="${t.muted}">private</text>
<text x="${x + pad}" y="${y + 82}" font-size="24" font-weight="700" fill="${t.fg}">${esc(p.title)}</text>
${desc}${tags}</g>`;
}

// Cards flow into rows: a featured card takes a whole row on desktop, the
// rest pair up. Each row is as tall as its longest description needs.
function projects(t, w) {
  const cols = isWide(w) ? 2 : 1;
  const gap = 16;
  const rows = [];
  for (const p of PROJECTS) {
    const last = rows.at(-1);
    if (p.featured || !last || last.full || last.items.length >= cols) rows.push({ full: Boolean(p.featured), items: [p] });
    else last.items.push(p);
  }

  const parts = [];
  let y = 0;
  let index = 0;
  for (const row of rows) {
    const cw = row.full ? w : (w - gap * (cols - 1)) / cols;
    const maxChars = Math.floor((cw - 48) / (18 * 0.6));
    const wrapped = row.items.map((p) => wrap(p.desc, maxChars));
    const lines = Math.max(...wrapped.map((l) => l.length));
    const chipsY = 114 + (lines - 1) * 26 + 20;
    const chipLines = Math.max(...row.items.map((p) => chipRows(p.tags, cw - 48).length));
    const ch = chipsY + (chipLines - 1) * CHIP_ROW + 50;
    row.items.forEach((p, k) => {
      parts.push(card(t, p, k * (cw + gap), y, cw, ch, wrapped[k], chipsY, index++));
    });
    y += ch + gap;
  }

  const css = `.card{animation:rise .5s cubic-bezier(.2,.7,.2,1) both}${RISE_CSS}`;
  return svgDoc({ width: w, height: y - gap, label: `Projects: ${PROJECTS.map((p) => p.title).join(', ')}`, css, body: parts.join('\n') });
}

// ------------------------------------------------------------- icon marks
async function fetchIcon(slug) {
  if (typeof slug !== 'string') return { mono: slug.mono };
  const res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@${ICONS_VERSION}/icons/${slug}.svg`);
  if (!res.ok) throw new Error(`Icon ${slug} failed: ${res.status}`);
  const path = (await res.text()).match(/<path d="([^"]+)"/)?.[1];
  if (!path) throw new Error(`Icon ${slug} has no path`);
  return { path };
}

// Draws a brand mark, or a monogram tile in the same weight when the icon
// set has no mark for it, centered on (cx, top + size / 2).
function mark(t, icon, cx, top, size) {
  if (icon.path) {
    return `<path transform="translate(${(cx - size / 2).toFixed(1)} ${top}) scale(${(size / 24).toFixed(4)})" d="${icon.path}" fill="${t.fg}"/>`;
  }
  const s = size * 0.92;
  return `<rect x="${(cx - s / 2).toFixed(1)}" y="${(top + (size - s) / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" rx="${(s * 0.22).toFixed(1)}" fill="${t.fg}"/><text x="${cx.toFixed(1)}" y="${(top + size / 2 + size * 0.17).toFixed(1)}" text-anchor="middle" font-size="${(size * 0.46).toFixed(1)}" font-weight="800" fill="${t.surface}">${esc(icon.mono)}</text>`;
}

// ------------------------------------------------------------- tech stack
// One labelled row per group on desktop; on phones the label sits above a
// wrapped grid.
function stack(t, w, groups) {
  const wide = isWide(w);
  const labelW = wide ? 112 : 0;
  const cols = wide ? 7 : 4;
  const cellW = (w - labelW) / cols;
  const icon = wide ? 30 : 28;
  const cellH = 74;
  const parts = [];
  let y = 0;
  let n = 0;
  for (const [label, items] of groups) {
    if (!wide) {
      parts.push(`<text x="0" y="${y + 16}" font-size="15" fill="${t.accent}">${esc(label)}</text>`);
      y += 28;
    } else {
      parts.push(`<text x="0" y="${y + icon / 2 + 14}" font-size="15" fill="${t.accent}">${esc(label)}</text>`);
    }
    items.forEach(({ icon: ic, label: name }, i) => {
      const cx = labelW + (i % cols) * cellW + cellW / 2;
      const top = y + Math.floor(i / cols) * cellH + 4;
      parts.push(`<g class="cell" style="animation-delay:${(0.025 * n++).toFixed(3)}s">${mark(t, ic, cx, top, icon)}<text x="${cx.toFixed(1)}" y="${top + icon + 22}" text-anchor="middle" font-size="13" fill="${t.muted}">${esc(name)}</text></g>`);
    });
    y += Math.ceil(items.length / cols) * cellH + (wide ? 6 : 10);
  }
  const all = groups.flatMap(([, items]) => items.map((i) => i.label));
  const css = '.cell{animation:fade .4s ease-out both}@keyframes fade{from{opacity:0}to{opacity:1}}';
  return svgDoc({ width: w, height: y - 8, label: `Tech stack: ${all.join(', ')}`, css, body: parts.join('\n') });
}

// ---------------------------------------------------------------- agents
function agents(t, w, list) {
  const wide = isWide(w);
  const perRow = wide ? list.length : 3;
  const gap = 10;
  const tileW = (w - gap * (perRow - 1)) / perRow;
  const tileH = 112;
  const parts = [];
  list.forEach(({ icon, name, kind }, i) => {
    const x = (i % perRow) * (tileW + gap);
    const y = Math.floor(i / perRow) * (tileH + gap);
    const cx = x + tileW / 2;
    parts.push(`<g class="cell" style="animation-delay:${(0.06 * i).toFixed(2)}s"><rect x="${x + 0.5}" y="${y + 0.5}" width="${tileW - 1}" height="${tileH - 1}" rx="10" fill="${t.surface}" stroke="${t.faint}"/>
${mark(t, icon, cx, y + 18, 32)}<text x="${cx.toFixed(1)}" y="${y + 76}" text-anchor="middle" font-size="15" font-weight="700" fill="${t.fg}">${esc(name)}</text><text x="${cx.toFixed(1)}" y="${y + 96}" text-anchor="middle" font-size="13" fill="${t.muted}">${esc(kind)}</text></g>`);
  });
  let y = Math.ceil(list.length / perRow) * (tileH + gap) + 18;

  const size = wide ? 17 : 16;
  const maxChars = Math.floor((w - 24) / (size * 0.6));
  for (const item of AGENT_WORKFLOW) {
    wrap(item, maxChars).forEach((line, j) => {
      const bullet = j === 0 ? `<tspan fill="${t.accent}">▸</tspan> ` : '  ';
      parts.push(`<text x="0" y="${y}" font-size="${size}" fill="${t.muted}" xml:space="preserve">${bullet}${esc(line)}</text>`);
      y += size * 1.5;
    });
    y += 6;
  }

  const css = '.cell{animation:fade .4s ease-out both}@keyframes fade{from{opacity:0}to{opacity:1}}';
  return svgDoc({ width: w, height: y - size, label: `AI coding agents: ${list.map((a) => a.name).join(', ')}. ${AGENT_WORKFLOW.join(' ')}`, css, body: parts.join('\n') });
}

// ------------------------------------------------------------------- main
mkdirSync(OUT_DIR, { recursive: true });
const stackGroups = await Promise.all(STACK_GROUPS.map(async ([label, items]) => [
  label,
  await Promise.all(items.map(async ([slug, name]) => ({ icon: await fetchIcon(slug), label: name }))),
]));
const agentList = await Promise.all(AGENTS.map(async ([slug, name, kind]) => ({ icon: await fetchIcon(slug), name, kind })));

const builders = {
  hero,
  portfolio,
  projects,
  stack: (t, w) => stack(t, w, stackGroups),
  agents: (t, w) => agents(t, w, agentList),
};
for (const [name, render] of Object.entries(builders)) {
  for (const { file, svg } of variants(render)) writeFileSync(`${OUT_DIR}${name}-${file}`, svg);
}
console.log(`Wrote static assets to ${OUT_DIR}`);
