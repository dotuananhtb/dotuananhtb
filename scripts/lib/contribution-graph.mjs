// Contribution grid in GitHub's layout (weeks as columns, Sunday on top),
// with a snake that sweeps the grid column by column and eats every
// colored cell it passes. Drawn from the merged daily counts, which the
// stock snake action cannot do because it reads a single account.
import { fmt, svgDoc } from './svg-kit.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Groups days into Sunday-first week columns, as GitHub draws them.
function toWeeks(days) {
  const weeks = [];
  for (const d of days) {
    const weekday = new Date(`${d.date}T00:00:00Z`).getUTCDay();
    if (weeks.length === 0 || weekday === 0) weeks.push([]);
    weeks.at(-1).push({ ...d, row: weekday });
  }
  return weeks;
}

// Same idea as GitHub: four levels split at the quartiles of active days.
function levelFor(days) {
  const active = days.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p) => active[Math.min(active.length - 1, Math.floor(p * active.length))] ?? 0;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  return (c) => (c === 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4);
}

export function renderGraph(t, w, days) {
  const wide = w >= 600;
  const weeks = toWeeks(days).slice(wide ? 0 : -26);
  const level = levelFor(weeks.flat());
  const pitch = w / weeks.length;
  const cell = pitch * 0.8;
  const top = 24;
  const r = Math.max(cell * 0.18, 1.5);
  const center = (col, row) => [col * pitch + cell / 2, top + row * pitch + cell / 2];

  // Snake route: down even columns, up odd ones, through every drawn day.
  const route = [];
  weeks.forEach((week, col) => {
    const ordered = col % 2 === 0 ? week : [...week].reverse();
    for (const d of ordered) route.push({ ...d, col });
  });
  const step = wide ? 0.045 : 0.06;
  const moveEnd = (route.length - 1) * step;
  const cycle = moveEnd + 3;
  const pct = (s) => ((s / cycle) * 100).toFixed(3);

  const base = [];
  const lit = [];
  const keyframes = [];
  route.forEach((d, i) => {
    const [cx, cy] = center(d.col, d.row);
    const x = (cx - cell / 2).toFixed(1);
    const y = (cy - cell / 2).toFixed(1);
    base.push(`<rect x="${x}" y="${y}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" rx="${r.toFixed(1)}" fill="${t.levels[0]}"/>`);
    const lv = level(d.count);
    if (lv === 0) return;
    // Each lit cell disappears when the head reaches it and returns at the end of the loop.
    const eat = i * step;
    keyframes.push(`@keyframes e${i}{0%,${pct(eat)}%{fill-opacity:1}${pct(eat + 0.05)}%,97%{fill-opacity:0}100%{fill-opacity:1}}`);
    lit.push(`<rect style="animation:e${i} ${cycle.toFixed(2)}s linear infinite" x="${x}" y="${y}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" rx="${r.toFixed(1)}" fill="${t.levels[lv]}"><title>${d.date}: ${d.count}</title></rect>`);
  });

  // Month labels above the first week that starts in a new month.
  const months = [];
  let lastMonth = -1;
  let lastCol = -10;
  weeks.forEach((week, col) => {
    const m = new Date(`${week[0].date}T00:00:00Z`).getUTCMonth();
    if (m !== lastMonth && col - lastCol >= 3) {
      months.push(`<text x="${(col * pitch).toFixed(1)}" y="14" font-size="13" fill="${t.muted}">${MONTHS[m]}</text>`);
      lastCol = col;
    }
    lastMonth = m;
  });

  const path = route.map((d, i) => `${i ? 'L' : 'M'}${center(d.col, d.row).map((v) => v.toFixed(1)).join(' ')}`).join(' ');
  const segments = [1, 0.9, 0.8, 0.7].map((scale, k) => {
    const s = cell * scale;
    return `<rect class="seg" style="animation-delay:${(k * step).toFixed(3)}s" x="${(-s / 2).toFixed(1)}" y="${(-s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" rx="${(s * 0.3).toFixed(1)}" fill="${t.snake}"/>`;
  }).reverse().join('');

  const gridBottom = top + 7 * pitch;
  const legendY = gridBottom + 16;
  const sw = 11;
  const legendX = w - (5 * (sw + 4)) - 40;
  const legend = t.levels.map((c, i) => `<rect x="${legendX + i * (sw + 4)}" y="${legendY - 10}" width="${sw}" height="${sw}" rx="2" fill="${c}"/>`).join('');
  const total = weeks.flat().reduce((s, d) => s + d.count, 0);
  const span = wide ? 'contributions in the last year' : 'in the last 26 weeks';

  const css = `${keyframes.join('')}
.seg{offset-path:path('${path}');offset-rotate:0deg;animation:move ${cycle.toFixed(2)}s linear infinite}
@keyframes move{0%{offset-distance:0%;opacity:1}${pct(moveEnd)}%{offset-distance:100%;opacity:1}${pct(moveEnd + 0.4)}%,100%{offset-distance:100%;opacity:0}}`;
  const body = `${months.join('')}
<g>${base.join('')}</g>
<g>${lit.join('')}</g>
<g class="motion-only">${segments}</g>
<text x="0" y="${legendY}" font-size="13" fill="${t.muted}">${fmt(total)} ${span}</text>
<text x="${legendX - 8}" y="${legendY}" text-anchor="end" font-size="13" fill="${t.muted}">less</text>${legend}<text x="${legendX + 5 * (sw + 4) + 4}" y="${legendY}" font-size="13" fill="${t.muted}">more</text>`;

  return svgDoc({ width: w, height: legendY + 6, label: `Contribution graph: ${fmt(total)} contributions ${wide ? 'in the last year' : span}`, css, body });
}
