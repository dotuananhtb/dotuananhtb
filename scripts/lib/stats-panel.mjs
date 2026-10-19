// Stats panel: the year's total with a weekly bar chart, plus three tiles.
import { esc, fmt, svgDoc } from './svg-kit.mjs';

function longestStreak(days) {
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

// Without the owner's token, commit and PR totals would only cover public
// repos, so the tiles switch to figures the daily counts can back up.
function tiles(data, weekly) {
  if (data.hasOwnerToken) {
    return [[fmt(data.commits), 'commits'], [fmt(data.prs), 'pull requests'], [fmt(data.repos), 'repositories']];
  }
  return [
    [fmt(data.days.filter((d) => d.count > 0).length), 'active days'],
    [fmt(longestStreak(data.days)), 'day best streak'],
    [fmt(Math.max(...weekly)), 'in busiest week'],
  ];
}

function weeklyTotals(days) {
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7).reduce((s, d) => s + d.count, 0));
  return weeks;
}

// Bars share one linear scale from zero to the busiest week.
function bars(t, weekly, x0, width, base, height) {
  const peak = Math.max(...weekly, 1);
  const step = width / weekly.length;
  return weekly.map((v, i) => {
    const h = Math.max((v / peak) * height, v > 0 ? 2 : 0);
    return `<rect class="bar" style="animation-delay:${(0.4 + i * 0.012).toFixed(3)}s" x="${(x0 + i * step).toFixed(1)}" y="${(base - h).toFixed(1)}" width="${Math.max(step - 2, 1).toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="${t.accent}"/>`;
  }).join('');
}

export function renderStats(t, w, data, today) {
  const wide = w >= 600;
  const weekly = weeklyTotals(data.days);
  const total = data.days.reduce((s, d) => s + d.count, 0);
  const peak = Math.max(...weekly, 1);
  const items = tiles(data, weekly);
  const scope = data.merged ? 'last year · all accounts' : 'in the last year';
  const gap = 16;
  const parts = [];

  // Headline tile: total on the left (wide) or above (narrow) the chart.
  const topH = wide ? 148 : 236;
  const chartX = wide ? 330 : 22;
  const chartW = w - chartX - (wide ? 24 : 22);
  const chartBase = wide ? 112 : 192;
  const chartH = wide ? 80 : 64;
  parts.push(`<rect x="0.5" y="0.5" width="${w - 1}" height="${topH - 1}" rx="10" fill="${t.surface}" stroke="${t.faint}"/>
<text x="22" y="${wide ? 74 : 62}" font-size="${wide ? 56 : 46}" font-weight="800" fill="${t.fg}">${fmt(total)}</text>
<text x="22" y="${wide ? 104 : 90}" font-size="17" fill="${t.muted}">contributions</text>
<text x="22" y="${wide ? 126 : 112}" font-size="17" fill="${t.muted}">${scope}</text>
<line x1="${chartX}" y1="${chartBase + 0.5}" x2="${chartX + chartW}" y2="${chartBase + 0.5}" stroke="${t.faint}"/>
${bars(t, weekly, chartX, chartW, chartBase, chartH)}
<text x="${chartX}" y="${chartBase + 24}" font-size="14" fill="${t.muted}">52 weeks ago</text>
<text x="${chartX + chartW}" y="${chartBase + 24}" text-anchor="end" font-size="14" fill="${t.muted}">this week</text>
<text x="${w - 22}" y="28" text-anchor="end" font-size="14" fill="${t.muted}">peak ${fmt(peak)}/week</text>`);

  // Three tiles side by side (wide) or as stacked rows (narrow).
  let y = topH + gap;
  if (wide) {
    const tileW = (w - gap * 2) / 3;
    items.forEach(([value, label], i) => {
      const x = i * (tileW + gap);
      parts.push(`<rect x="${x + 0.5}" y="${y + 0.5}" width="${tileW - 1}" height="111" rx="10" fill="${t.surface}" stroke="${t.faint}"/>
<text x="${x + 22}" y="${y + 58}" font-size="40" font-weight="800" fill="${t.fg}">${esc(value)}</text>
<text x="${x + 22}" y="${y + 90}" font-size="17" fill="${t.muted}">${esc(label)}</text>`);
    });
    y += 112;
  } else {
    items.forEach(([value, label]) => {
      const valueW = value.length * 30 * 0.6;
      parts.push(`<rect x="0.5" y="${y + 0.5}" width="${w - 1}" height="63" rx="10" fill="${t.surface}" stroke="${t.faint}"/>
<text x="22" y="${y + 43}" font-size="30" font-weight="800" fill="${t.fg}">${esc(value)}</text>
<text x="${(22 + valueW + 14).toFixed(1)}" y="${y + 40}" font-size="17" fill="${t.muted}">${esc(label)}</text>`);
      y += 64 + 10;
    });
    y -= 10;
  }
  parts.push(`<text x="${w}" y="${y + 24}" text-anchor="end" font-size="13" fill="${t.muted}">updated ${today}</text>`);

  const css = '.bar{transform-box:fill-box;transform-origin:bottom;animation:grow .5s cubic-bezier(.2,.7,.2,1) both}@keyframes grow{from{transform:scaleY(0)}to{transform:none}}';
  const label = `${fmt(total)} contributions ${scope}; ${items.map(([v, l]) => `${v} ${l}`).join(', ')}`;
  return svgDoc({ width: w, height: y + 30, label, css, body: parts.join('\n') });
}
