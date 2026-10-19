#!/usr/bin/env node
// Generates a neofetch-style SVG card from live GitHub data.
// Usage: GITHUB_TOKEN=... node scripts/neofetch-card.mjs [output.svg]
// The default Actions token is enough: the contribution calendar includes
// private contributions because the profile shows them publicly.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const USER = process.env.GITHUB_USER || 'dotuananhtb';
const TOKEN = process.env.GITHUB_TOKEN;
const OUT = process.argv[2] || 'dist/neofetch.svg';

// Static profile facts; edit these lines to change what the card says.
const PROFILE = [
  ['Role', 'Full-Stack Developer'],
  ['Location', 'Vietnam'],
  ['Frontend', 'TypeScript · React · Next.js'],
  ['Backend', 'Node.js · Java/Spring Boot · Python'],
  ['Mobile', 'Flutter'],
  ['Data', 'PostgreSQL · MongoDB · MySQL · Redis'],
  ['DevOps', 'Docker · AWS · Nginx · GitHub Actions'],
];

const LOGO = [
  ' ___  _____  _   ',
  '|   \\|_   _|/_\\  ',
  '| |) | | | / _ \\ ',
  '|___/  |_|/_/ \\_\\',
];

const COLORS = {
  bg: '#0f1419', bar: '#161c25', border: '#263040', fg: '#c9d1d9', dim: '#6e7681',
  green: '#7ee787', cyan: '#79c0ff', yellow: '#e3b341',
};
const PALETTE = ['#ff7b72', '#7ee787', '#e3b341', '#79c0ff', '#d2a8ff', '#56d4dd', '#c9d1d9', '#6e7681'];
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

const QUERY = `query($login: String!) {
  user(login: $login) {
    createdAt
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

async function fetchUser() {
  if (!TOKEN) throw new Error('GITHUB_TOKEN is required');
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'neofetch-card' },
    body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
  });
  const body = await res.json();
  if (!res.ok || body.errors || !body.data?.user) {
    throw new Error(`GitHub API error (${res.status}): ${JSON.stringify(body.errors ?? body)}`);
  }
  return body.data.user;
}

// A day with no contributions yet today does not break the current streak.
function streaks(days) {
  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = day.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  let i = days.length - 1;
  if (i >= 0 && days[i].contributionCount === 0) i--;
  for (; i >= 0 && days[i].contributionCount > 0; i--) current++;
  return { current, longest };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function uptime(createdAt, now) {
  const start = new Date(createdAt);
  let months = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + now.getUTCMonth() - start.getUTCMonth();
  if (now.getUTCDate() < start.getUTCDate()) months--;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${plural(years, 'year')}, ${plural(rest, 'month')}` : plural(years, 'year');
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function render(user, now) {
  const calendar = user.contributionsCollection.contributionCalendar;
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  const { current, longest } = streaks(days);
  const rows = [
    ...PROFILE,
    ['Uptime', `${uptime(user.createdAt, now)} on GitHub`],
    ['Contribs', `${calendar.totalContributions.toLocaleString('en-US')} in the last year`],
    // An idle day would read as "0 days now", so show only the best run then.
    ['Streak', current > 0 ? `${plural(current, 'day')} now · ${plural(longest, 'day')} best` : `${plural(longest, 'day')} best in the last year`],
  ];

  const W = 860;
  const LH = 26;
  const TOP = 76;
  const LEFT = 32;
  const COL = 250;
  const KEY_W = 100;
  const paletteY = TOP + (rows.length + 2) * LH - 6;
  const H = paletteY + 44;

  const logo = LOGO.map((l, i) => `<text x="${LEFT}" y="${TOP + 8 + i * 20}" xml:space="preserve" fill="${COLORS.cyan}" font-weight="700">${esc(l)}</text>`).join('\n    ');
  const info = rows.map(([k, v], i) => {
    const y = TOP + (i + 2) * LH;
    return `<text x="${COL}" y="${y}" fill="${COLORS.yellow}">${esc(k)}</text><text x="${COL + KEY_W}" y="${y}" fill="${COLORS.fg}">${esc(v)}</text>`;
  }).join('\n    ');
  const palette = PALETTE.map((c, i) => `<rect x="${COL + i * 30}" y="${paletteY}" width="26" height="16" rx="2" fill="${c}"/>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="neofetch: ${esc(USER)} on GitHub, ${esc(calendar.totalContributions)} contributions in the last year">
  <defs><clipPath id="win"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10"/></clipPath></defs>
  <g clip-path="url(#win)">
    <rect width="${W}" height="${H}" fill="${COLORS.bg}"/>
    <rect width="${W}" height="36" fill="${COLORS.bar}"/>
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="none" stroke="${COLORS.border}"/>
  <circle cx="22" cy="18" r="6" fill="#ff5f57"/><circle cx="42" cy="18" r="6" fill="#febc2e"/><circle cx="62" cy="18" r="6" fill="#28c840"/>
  <text x="${W / 2}" y="23" text-anchor="middle" fill="${COLORS.dim}" font-family="${MONO}" font-size="13">anh@github: ~ — neofetch</text>
  <g font-family="${MONO}" font-size="15">
    ${logo}
    <text x="${COL}" y="${TOP}"><tspan fill="${COLORS.green}" font-weight="700">${esc(USER)}</tspan><tspan fill="${COLORS.fg}">@</tspan><tspan fill="${COLORS.green}" font-weight="700">github</tspan></text>
    <text x="${COL}" y="${TOP + LH}" fill="${COLORS.dim}">${'-'.repeat(USER.length + 7)}</text>
    ${info}
    ${palette}
    <text x="${W - 24}" y="${H - 16}" text-anchor="end" fill="${COLORS.dim}" font-size="12">updated ${now.toISOString().slice(0, 10)}</text>
  </g>
</svg>
`;
}

const user = await fetchUser();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, render(user, new Date()));
console.log(`Wrote ${OUT}`);
