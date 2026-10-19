#!/usr/bin/env node
// Exports a second account's daily commit and pull request counts for the
// last year, so the profile images can include work done under that account.
// Runs on the owner's machine with that account's existing login; the token
// never leaves the machine and only plain counts are written.
// Usage: WORK_TOKEN=... node scripts/export-work-activity.mjs <out.json>
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadWork } from './lib/activity-data.mjs';

const token = process.env.WORK_TOKEN;
const out = process.argv[2];
if (!token || !out) throw new Error('Usage: WORK_TOKEN=... node scripts/export-work-activity.mjs <out.json>');

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const work = await loadWork(token, day(-366), day(0));

const days = Object.fromEntries([...work.perDay.entries()].sort(([a], [b]) => a.localeCompare(b)));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify({ commits: work.commits, prs: work.prs, days }, null, 1)}\n`);
console.log(`Exported ${work.commits} commits and ${work.prs} pull requests over ${Object.keys(days).length} active days`);
