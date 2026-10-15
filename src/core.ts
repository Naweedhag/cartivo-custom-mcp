import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { realpath } from 'node:fs/promises';
const exec = promisify(execFile);
export const repos = {
  application: { repository: 'mahdipakravan-dev/cartivo-application', purpose: 'Customer storefront', stack: 'Next.js / React / TypeScript' },
  frontend: { repository: 'mahdipakravan-dev/cartivo-frontend', purpose: 'Admin dashboard', stack: 'Vite / React / TypeScript' },
  backend: { repository: 'mahdipakravan-dev/cartivo-backend', purpose: 'Business API', stack: 'Java 21 / Spring Boot / PostgreSQL' },
} as const;
export type Repo = keyof typeof repos;
export const domains = {
  catalog: 'Normalize product data, preserve sources, detect duplicates; publishing needs a verified API.',
  fit: 'Extract evidence; deterministic rules decide compatibility, including insufficient information.',
  price: 'Compare equivalent offers; price writes require approved margin and change limits.',
  care: 'Prepare customer follow-ups; sending requires consent, channel limits and explicit authorization.',
  cfo: 'Prepare reconciliation and settlement proposals; no payment execution in v0.1.',
  warehouse: 'Plan inventory and fulfillment; reservations require transactional backend APIs and physical evidence.',
};
export function planChange(request: string, selected: Repo[]) {
  return { request, repositories: selected.map(r => repos[r].repository), status: 'plan_only', productionRevision: 'unverified',
    steps: ['Verify deployed branch and commit', 'Create ai/ branch', 'Inspect instructions and edit code using coding-client tools', 'Run lint, typecheck, tests and build', 'Review CI results', 'Create private staging preview', 'Open PR with evidence', 'Obtain human approval for exact release revision', 'Deploy through approved provider and verify health; retain rollback artifact'],
    blocked: ['Production deployment is not exposed', 'Database migrations, authentication and payment changes require separate explicit approval'],
  };
}
export async function githubStatus(repo: Repo, token?: string, fetcher: typeof fetch = fetch) {
  const base = `https://api.github.com/repos/${repos[repo].repository}`;
  const headers: Record<string,string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const read = async (url: string) => {
    const response = await fetcher(url, { headers, redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`GitHub request failed (${response.status}); check repository access.`);
    return response.json();
  };
  const info = await read(base);
  const runs = await read(`${base}/actions/runs?per_page=5`);
  return { repository: repos[repo].repository, defaultBranch: info.default_branch, productionRevision: 'unverified',
    runs: runs.workflow_runs.map((r: any) => ({ name: r.name, status: r.status, conclusion: r.conclusion, commit: r.head_sha, branch: r.head_branch, url: r.html_url })) };
}
export async function localCheck(repo: Repo, check: 'lint'|'typecheck'|'test'|'build', env = process.env) {
  if (env.CARTIVO_ENABLE_LOCAL_CHECKS !== 'true') throw new Error('Local checks disabled. Operator must explicitly enable execution of trusted repository scripts.');
  if (repo === 'backend') throw new Error('Backend checks require an isolated Java runner; not configured in v0.1.');
  const path = env[`CARTIVO_${repo.toUpperCase()}_PATH`];
  if (!path) throw new Error('Repository path not configured.');
  const cwd = await realpath(path);
  // Scripts are operator-trusted code; no caller-supplied commands or arguments.
  const args = ['run', check];
  const cleanEnv = { PATH: env.PATH, HOME: env.HOME, CI: 'true', NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8080', VITE_API_BASE_URL: 'http://127.0.0.1:8080' };
  try {
    await exec('npm', args, { cwd, env: cleanEnv, timeout: 120000, maxBuffer: 1024 * 1024 });
    return { repo, check, passed: true };
  } catch {
    // Never return raw output: repository scripts may print credentials or private data.
    return { repo, check, passed: false, detail: 'Check failed, timed out or exceeded output limit. Inspect locally in the trusted runner.' };
  }
}
