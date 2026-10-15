import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { repos, domains, planChange, githubStatus, localCheck } from './core.js';
export function createServer() {
    const server = new McpServer({ name: 'cartivo-custom-mcp', version: '0.1.0' });
    const repo = z.enum(['application', 'frontend', 'backend']);
    const read = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
    const result = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
    async function guarded(name, operation) {
        try {
            const value = await operation();
            process.stderr.write(JSON.stringify({ time: new Date().toISOString(), tool: name, result: 'success' }) + '\n');
            return result(value);
        }
        catch (e) {
            process.stderr.write(JSON.stringify({ time: new Date().toISOString(), tool: name, result: 'error' }) + '\n');
            return { ...result({ error: e instanceof Error ? e.message : 'Operation failed' }), isError: true };
        }
    }
    server.registerTool('cartivo_project_context', { description: 'Verified project ownership and current integration limits.', inputSchema: {}, annotations: read }, async () => result({ repos, productionRevision: 'unverified', releaseEnabled: false }));
    server.registerTool('cartivo_domain_protocol', { description: 'Get requirements for an operational domain. Documentation only; does not execute business operations.', inputSchema: { domain: z.enum(['catalog', 'fit', 'price', 'care', 'cfo', 'warehouse']) }, annotations: read }, async ({ domain }) => result({ domain, protocol: domains[domain], execution: 'not_connected' }));
    server.registerTool('cartivo_plan_change', { description: 'Prepare the development-to-release checklist. Does not edit, deploy or approve.', inputSchema: { request: z.string().min(1).max(4000), repositories: z.array(repo).min(1).max(3) }, annotations: read }, async ({ request, repositories }) => result(planChange(request, repositories)));
    server.registerTool('cartivo_github_status', { description: 'Read repository default branch and recent CI runs. Default branch is not proof of production.', inputSchema: { repo }, annotations: { ...read, openWorldHint: true } }, async ({ repo }) => guarded('github_status', () => githubStatus(repo, process.env.GITHUB_TOKEN)));
    server.registerTool('cartivo_run_check', { description: 'Run a fixed npm check in an operator-approved local checkout. Scripts can have side effects. Disabled by default.', inputSchema: { repo, check: z.enum(['lint', 'typecheck', 'test', 'build']) }, annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true } }, async ({ repo, check }) => guarded('run_check', () => localCheck(repo, check)));
    return server;
}
