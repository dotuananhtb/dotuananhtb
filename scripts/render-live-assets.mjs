#!/usr/bin/env node
// Renders the images that change daily (stats panel, contribution graph) for
// every theme and layout. Run by .github/workflows/profile-assets.yml.
// Usage: GITHUB_TOKEN=... [STATS_TOKEN=...] [WORK_ACTIVITY=file.json] node scripts/render-live-assets.mjs [out-dir]
//
// STATS_TOKEN:   read-only token of the profile owner; adds private commits,
//                pull requests and repositories to the stats tiles.
// WORK_ACTIVITY: daily counts from a second account, exported on the owner's
//                machine by scripts/export-work-activity.mjs. Missing or
//                unreadable files are skipped, so the images still render.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { loadActivity } from './lib/activity-data.mjs';
import { renderGraph } from './lib/contribution-graph.mjs';
import { renderStats } from './lib/stats-panel.mjs';
import { variants } from './lib/svg-kit.mjs';

const OUT_DIR = process.argv[2] || 'dist';
const publicToken = process.env.GITHUB_TOKEN;
if (!publicToken && !process.env.STATS_TOKEN) throw new Error('GITHUB_TOKEN or STATS_TOKEN is required');

function readWork(file) {
  if (!file || !existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.warn(`Work activity skipped: ${err.message}`);
    return undefined;
  }
}

const data = await loadActivity({
  login: process.env.GITHUB_USER || 'dotuananhtb',
  publicToken,
  ownerToken: process.env.STATS_TOKEN,
  work: readWork(process.env.WORK_ACTIVITY),
});
const today = new Date().toISOString().slice(0, 10);

mkdirSync(OUT_DIR, { recursive: true });
const images = {
  stats: (t, w) => renderStats(t, w, data, today),
  graph: (t, w) => renderGraph(t, w, data.days),
};
for (const [name, render] of Object.entries(images)) {
  for (const { file, svg } of variants(render)) writeFileSync(`${OUT_DIR}/${name}-${file}`, svg);
}
console.log(`Wrote live assets to ${OUT_DIR} (owner token: ${data.hasOwnerToken ? 'yes' : 'no'}, work activity: ${data.merged ? 'merged' : 'none'})`);
