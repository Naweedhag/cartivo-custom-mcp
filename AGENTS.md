# Cartivo MCP
Codex is the orchestrator; MCP exposes constrained tools, not an autonomous scheduler.
Run npm run build and npm test before proposing changes.
Never expose arbitrary shell, SQL, arbitrary URLs or a self-approval tool.
Keep production deployment, migrations, payments and authentication changes gated by explicit human approval.
Do not infer the deployed revision from the repository default branch.
Use ai/ branches and PRs. Never claim a preview, deployment, API integration or approval exists without evidence.
Do not log tokens, tool arguments containing customer data, or raw command output.
