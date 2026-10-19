// Loads one year of daily activity for the profile and, optionally, merges in
// daily counts exported from a second (work) account. The work account is
// identified only through its token, so its username never appears in this
// repo, the logs or the images.

const API = 'https://api.github.com';
// The search API allows 30 requests per minute; stay just under it.
const SEARCH_PAUSE_MS = 2100;
const SEARCH_CAP = 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(token, path, init = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'profile-assets', ...init.headers },
    });
    if ((res.status === 403 || res.status === 429) && attempt < 2) {
      const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
      await sleep(Math.min(Math.max(reset - Date.now(), 5000), 65000));
      continue;
    }
    const body = await res.json();
    if (!res.ok) throw new Error(`GitHub ${path.split('?')[0]} failed (${res.status}): ${body.message ?? ''}`);
    return body;
  }
  throw new Error(`GitHub ${path.split('?')[0]} kept hitting the rate limit`);
}

const MAIN_QUERY = `query($login: String!) {
  user(login: $login) {
    repositories(ownerAffiliations: OWNER) { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

async function loadMain(login, token) {
  const body = await request(token, '/graphql', { method: 'POST', body: JSON.stringify({ query: MAIN_QUERY, variables: { login } }) });
  if (body.errors || !body.data?.user) throw new Error(`GitHub GraphQL error: ${JSON.stringify(body.errors)}`);
  const user = body.data.user;
  const cc = user.contributionsCollection;
  return {
    days: cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount })),
    commits: cc.totalCommitContributions,
    prs: cc.totalPullRequestContributions,
    repos: user.repositories.totalCount,
  };
}

const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

// Collects every search hit in [from, to], splitting the date range whenever
// it holds more results than one query can page through.
async function searchAll(token, kind, query, field, from, to, pick) {
  const q = encodeURIComponent(`${query} ${field}:${from}..${to}`);
  await sleep(SEARCH_PAUSE_MS);
  const first = await request(token, `/search/${kind}?q=${q}&per_page=100&page=1`);
  if (first.total_count > SEARCH_CAP && from !== to) {
    const mid = addDays(from, Math.floor(daysBetween(from, to) / 2));
    return [
      ...(await searchAll(token, kind, query, field, from, mid, pick)),
      ...(await searchAll(token, kind, query, field, addDays(mid, 1), to, pick)),
    ];
  }
  const items = [...first.items];
  const pages = Math.min(Math.ceil(first.total_count / 100), SEARCH_CAP / 100);
  for (let page = 2; page <= pages; page++) {
    await sleep(SEARCH_PAUSE_MS);
    items.push(...(await request(token, `/search/${kind}?q=${q}&per_page=100&page=${page}`)).items);
  }
  return items.map(pick);
}

export async function loadWork(token, from, to) {
  const { login } = await request(token, '/user');
  const commits = await searchAll(token, 'commits', `author:${login}`, 'committer-date', from, to,
    (c) => ({ id: c.sha, date: c.commit.committer.date.slice(0, 10) }));
  const prs = await searchAll(token, 'issues', `author:${login} type:pr`, 'created', from, to,
    (p) => ({ id: p.id, date: p.created_at.slice(0, 10) }));
  // The same commit can show up once per fork; count each SHA once.
  const uniqueCommits = [...new Map(commits.map((c) => [c.id, c])).values()];
  const perDay = new Map();
  for (const item of [...uniqueCommits, ...prs]) perDay.set(item.date, (perDay.get(item.date) ?? 0) + 1);
  return { perDay, commits: uniqueCommits.length, prs: prs.length };
}

// Returns daily counts plus totals. Failures in the optional work account
// never block the images: the panel falls back to the main account alone.
// `work` is the export written by scripts/export-work-activity.mjs:
// { days: { 'YYYY-MM-DD': count }, commits, prs }.
export async function loadActivity({ login, publicToken, ownerToken, work }) {
  const main = await loadMain(login, ownerToken || publicToken);
  const result = { ...main, hasOwnerToken: Boolean(ownerToken), merged: false };
  if (!work) return result;
  result.days = main.days.map((d) => ({ date: d.date, count: d.count + (work.days[d.date] ?? 0) }));
  result.commits += work.commits;
  result.prs += work.prs;
  result.merged = true;
  return result;
}
