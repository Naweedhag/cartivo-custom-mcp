# Cartivo Custom MCP

Version 0.1 provides TypeScript MCP tools for Codex to understand Cartivo, plan changes, inspect GitHub CI and run explicitly enabled local checks. Codex performs reasoning and code editing using its coding tools. This server is not a background agent or a scheduler.

## Run

Node 22.18+ is required. Install with `npm install`, then run `npm run build` and `npm test`. Start stdio with `npm start`. A local MCP client can launch `node` with the absolute path to `dist/index.js`.

For a local Streamable HTTP endpoint, set a randomly generated `CARTIVO_MCP_TOKEN` (at least 32 characters) in the process environment and run `node dist/http.js`. The endpoint is `http://127.0.0.1:3100/mcp` and requires `Authorization: Bearer <token>`. It rejects browser origins and unexpected Host headers. It is a local prototype, not a public ChatGPT deployment. Public hosting requires HTTPS and an approved authentication setup; do not simply expose this port.

Dependencies pin official SDK 1.29.0, available and tested locally. SDK v2 is now the stable line; this prototype uses the still-supported v1 line. Upgrade before long-term hosting. See https://github.com/modelcontextprotocol/typescript-sdk.

## Tools

| Tool | Implemented behavior |
|---|---|
| cartivo_project_context | Repo purposes and explicit integration limits |
| cartivo_domain_protocol | Requirements for Catalog, Fit, Price, Care, CFO or Warehouse; documentation only |
| cartivo_plan_change | Development-to-release checklist; no edits or execution |
| cartivo_github_status | Read default branch and latest five CI runs through GitHub API |
| cartivo_run_check | Fixed npm lint/typecheck/test/build command, disabled by default |

The customer storefront is **cartivo-application** (Next.js). The admin dashboard is **cartivo-frontend** (Vite). **cartivo-backend** is Java/Spring Boot/PostgreSQL. Original repositories belong to `mahdipakravan-dev`. Their deployed production branches and revisions remain unverified.

## Execution boundary

Configure local paths and `CARTIVO_ENABLE_LOCAL_CHECKS=true` only in an isolated runner with trusted repository scripts. Scripts can execute code and read checkout `.env` files; environment filtering is not a sandbox. Checks return pass/fail, not raw output. Backend execution is blocked until an isolated Java runner is configured. Production credentials must not exist in the runner.

External/command calls emit minimal JSON activity records on stderr. These are process logs, not durable compliance records. There is no persistence, scheduling, business API mutation, PR creation or deployment tool yet. The six business domains are contracts, not implemented business agents. Financial, payment, authentication and migration changes require separate explicit approval.

## Delivery workflow and remaining connections

1. Connect repository credentials with only required access; verify deployed revisions.
2. Read project instructions, create an AI branch and implement a small change through Codex.
3. Run local checks, inspect CI, fix failures and prepare a PR.
4. Connect an approved hosting provider to create private staging previews.
5. Bind human release approval to the exact revision and environment; retain the prior artifact for rollback.
6. Add provider-specific release/health/rollback tools, with approval enforced outside the model.
7. Connect verified staging business APIs for the six domains, beginning with reads and proposals.
8. Add durable jobs/events, audit storage and consent/permission policies for scheduled operations.

Scheduled banners should use a backend content API with draft/publish state, start/end dates, timezone, validation and audit history. That API does not exist in this server; schemas and migrations require approval. Apply the same approach to catalog, compatibility, pricing and fulfillment rather than adding generic SQL tools.

## Validation

Build and MCP in-memory integration tests passed locally using dependencies already installed in the workspace. Fresh network installation and lockfile generation were blocked by terminal network access. GitHub writes returned 403, so no branch, PR or remote commit was created. HTTP transport compiles, but its integration test could not start: this sandbox rejects binding localhost with EPERM. The full suite currently reports three passing tests and one environment-blocked failure. No production or database changes were made.
