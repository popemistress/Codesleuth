/* ============================================================
   CodeSleuth AI Docs — nav.js
   Builds header + sidebar + search on every page
   ============================================================ */

(function () {
  /* ── Navigation Structure ─────────────────────────────── */
  const NAV = [
    {
      group: 'Getting Started',
      items: [
        { label: 'Introduction',         icon: '🏠', href: 'index.html' },
        { label: 'Setup Wizard',         icon: '⚙️', href: 'setup-wizard.html' },
        { label: 'Quickstart',           icon: '⚡', href: 'quickstart.html' },
        { label: 'Architecture',         icon: '🏗️', href: 'architecture.html' },
        { label: 'Platform Capabilities',icon: '🌐', href: 'platform-capabilities.html' },
        { label: 'CLI Integrations',     icon: '🔧', href: 'cli-integrations.html' },
        { label: 'OS Setup',              icon: '🖥️', href: 'distributions.html' },
      ]
    },
    {
      group: 'Agents',
      items: [
        { label: 'Orchestrator',         icon: '🎯', href: 'orchestrator.html' },
        { label: 'Discovery',            icon: '🔍', href: 'discovery.html' },
        { label: 'Spec Enhancement',     icon: '✨', href: 'spec-enhancement.html' },
        { label: 'CIA System',           icon: '📡', href: 'cia-system.html' },
        { label: 'Technical Planning',   icon: '📐', href: 'planning.html' },
        { label: 'Application Builder',  icon: '🔨', href: 'builder.html' },
        { label: 'Critic',               icon: '📊', href: 'critic.html' },
        { label: 'Security',             icon: '🔒', href: 'security.html' },
        { label: 'Security Domains',     icon: '🛡️', href: 'security-domains.html' },
        { label: 'Verifier',             icon: '✅', href: 'verifier.html' },
      ]
    },
    {
      group: 'Features',
      items: [
        { label: 'Parallel Execution',   icon: '⚡', href: 'parallel-execution.html' },
        { label: 'Token Budget',         icon: '💰', href: 'token-budget.html' },
        { label: 'Context Management',   icon: '🧠', href: 'context-management.html' },
        { label: 'Error Memory',         icon: '📝', href: 'error-memory.html' },
        { label: 'MCP Catalog',          icon: '🔌', href: 'mcp-catalog.html' },
        { label: 'Component Libraries',  icon: '🧩', href: 'components.html' },
      ]
    },
    {
      group: 'Reference',
      items: [
        { label: 'Command Reference',    icon: '⌨️', href: 'commands.html' },
        { label: 'Artifacts Reference',  icon: '📁', href: 'artifacts-reference.html' },
        { label: 'Pattern Library',      icon: '🔁', href: 'pattern-library.html' },
        { label: 'Global Contract',      icon: '📜', href: 'global-contract.html' },
        { label: 'HANDOFF.json Schema',  icon: '🔗', href: 'handoff-schema.html' },
        { label: 'Platform Gates',       icon: '🚦', href: 'platform-gates.html' },
        { label: 'Design Contract',      icon: '🎨', href: 'design-contract.html' },
        { label: 'Pipeline Scripts',     icon: '🐍', href: 'scripts.html' },
        { label: 'Suggestion Tracker',   icon: '📋', href: 'suggestions.html' },
      ]
    }
  ];

  /* ── Search Index ─────────────────────────────────────── */
  const SEARCH_INDEX = [
    { title: 'Introduction',              href: 'index.html',           section: 'Getting Started' },
    { title: 'Setup Wizard',             href: 'setup-wizard.html',    section: 'Getting Started' },
    { title: 'SETUP.sh SETUP.ps1',       href: 'setup-wizard.html',    section: 'Getting Started' },
    { title: 'Tier 1 local backends',    href: 'setup-wizard.html',    section: 'Getting Started' },
    { title: 'Tier 2 cloud services',    href: 'setup-wizard.html',    section: 'Getting Started' },
    { title: 'context.json config file', href: 'setup-wizard.html',    section: 'Getting Started' },
    { title: 'SQLite Chroma mem0 Redis', href: 'setup-wizard.html',    section: 'Getting Started' },
    { title: 'Quickstart Guide',          href: 'quickstart.html',      section: 'Getting Started' },
    { title: 'Architecture Overview',     href: 'architecture.html',    section: 'Getting Started' },
    { title: 'Platform Capabilities',      href: 'platform-capabilities.html', section: 'Getting Started' },
    { title: 'Build targets overview',    href: 'platform-capabilities.html', section: 'Getting Started' },
    { title: 'Cross-platform matrix',     href: 'platform-capabilities.html', section: 'Getting Started' },
    { title: 'Orchestrator Agent',        href: 'orchestrator.html',    section: 'Agents' },
    { title: 'Human Gate Protocol',       href: 'orchestrator.html',    section: 'Agents' },
    { title: '!build gate',              href: 'orchestrator.html',    section: 'Agents' },
    { title: '!change command',           href: 'orchestrator.html',    section: 'Agents' },
    { title: 'Spec Change Protocol',      href: 'orchestrator.html',    section: 'Agents' },
    { title: 'Living Documentation',      href: 'orchestrator.html',    section: 'Agents' },
    { title: '!docs command',             href: 'orchestrator.html',    section: 'Agents' },
    { title: '!fork command',             href: 'orchestrator.html',    section: 'Agents' },
    { title: 'Discovery Agent',           href: 'discovery.html',       section: 'Agents' },
    { title: 'Fast-track mode',           href: 'discovery.html',       section: 'Agents' },
    { title: '!braindump command',        href: 'discovery.html',       section: 'Agents' },
    { title: 'HANDOFF.json v1',           href: 'discovery.html',       section: 'Agents' },
    { title: 'Spec Enhancement Loop',              href: 'spec-enhancement.html', section: 'Agents' },
    { title: '!enhance command',                   href: 'spec-enhancement.html', section: 'Agents' },
    { title: 'Would you like suggestions',         href: 'spec-enhancement.html', section: 'Agents' },
    { title: 'Enhancement recommendation table',   href: 'spec-enhancement.html', section: 'Agents' },
    { title: 'Feature suggestions Discovery',      href: 'spec-enhancement.html', section: 'Agents' },
    { title: 'Top 1% product recommendations',     href: 'spec-enhancement.html', section: 'Agents' },
    // OS Distributions
    { title: 'OS Setup — Linux macOS Windows', href: 'distributions.html', section: 'Getting Started' },
    { title: 'SETUP.sh macOS',            href: 'distributions.html',   section: 'Getting Started' },
    { title: 'SETUP.ps1 Windows',         href: 'distributions.html',   section: 'Getting Started' },
    { title: 'build.ps1 PowerShell',      href: 'distributions.html',   section: 'Getting Started' },
    { title: 'WSL2 Windows pipeline',     href: 'distributions.html',   section: 'Getting Started' },
    { title: 'Technical Planning Agent',  href: 'planning.html',        section: 'Agents' },
    { title: 'Two-Phase Planning',        href: 'planning.html',        section: 'Agents' },
    { title: 'DECISIONS.md patterns applied', href: 'planning.html',   section: 'Agents' },
    { title: 'TDD.md output',            href: 'planning.html',        section: 'Agents' },
    { title: 'TASK-GRAPH.md',            href: 'planning.html',        section: 'Agents' },
    { title: 'Contract Layer',           href: 'planning.html',        section: 'Agents' },
    { title: 'FILE_OWNERSHIP_MAP.md',    href: 'planning.html',        section: 'Agents' },
    { title: 'Application Builder',       href: 'builder.html',         section: 'Agents' },
    { title: 'Continuous execution',      href: 'builder.html',         section: 'Agents' },
    { title: 'CHECKPOINT.md',            href: 'builder.html',         section: 'Agents' },
    { title: 'STALE task status',        href: 'builder.html',         section: 'Agents' },
    { title: 'Change Impact Tracking',   href: 'builder.html',         section: 'Agents' },
    { title: 'Security Agent',            href: 'security.html',        section: 'Agents' },
    { title: '20 Security Domains',       href: 'security.html',        section: 'Agents' },
    { title: 'SECURITY_REPORT.md',       href: 'security.html',        section: 'Agents' },
    { title: 'Verifier Agent',            href: 'verifier.html',        section: 'Agents' },
    { title: 'SHIP verdict',             href: 'verifier.html',        section: 'Agents' },
    { title: 'NO-SHIP verdict',          href: 'verifier.html',        section: 'Agents' },
    { title: 'Performance Budget Gate',  href: 'verifier.html',        section: 'Agents' },
    { title: 'Contract Conformance',     href: 'verifier.html',        section: 'Agents' },
    { title: 'Critic Agent',              href: 'critic.html',          section: 'Agents' },
    { title: 'CRITICISM.md',             href: 'critic.html',          section: 'Agents' },
    { title: '12-Dimension Scorecard',   href: 'critic.html',          section: 'Agents' },
    { title: 'SHIP_READY verdict',       href: 'critic.html',          section: 'Agents' },
    { title: 'Command Reference',         href: 'commands.html',        section: 'Reference' },
    { title: '!status command',          href: 'commands.html',        section: 'Reference' },
    { title: '!reset command',           href: 'commands.html',        section: 'Reference' },
    { title: '!pipeline command',        href: 'commands.html',        section: 'Reference' },
    { title: '!pattern-add command',     href: 'commands.html',        section: 'Reference' },
    { title: 'Pattern Library',           href: 'pattern-library.html', section: 'Reference' },
    { title: 'PATTERN-NNN format',       href: 'pattern-library.html', section: 'Reference' },
    { title: 'PATTERN_INDEX.md',         href: 'pattern-library.html', section: 'Reference' },
    { title: 'Global Contract',           href: 'global-contract.html', section: 'Reference' },
    { title: 'RARV Cycle',               href: 'global-contract.html', section: 'Reference' },
    { title: 'Complexity Tiers',         href: 'global-contract.html', section: 'Reference' },
    { title: 'Token Budgets',            href: 'global-contract.html', section: 'Reference' },
    { title: 'HANDOFF.json Schema',       href: 'handoff-schema.html',  section: 'Reference' },
    { title: 'Schema versions v1-v6',    href: 'handoff-schema.html',  section: 'Reference' },
    { title: 'Platform Gates',            href: 'platform-gates.html',  section: 'Reference' },
    { title: 'Next.js stack',            href: 'platform-gates.html',  section: 'Reference' },
    { title: 'Tauri Desktop stack',      href: 'platform-gates.html',  section: 'Reference' },
    { title: 'Python Desktop stack',     href: 'platform-gates.html',  section: 'Reference' },
    { title: 'Rust GTK4 Linux stack',    href: 'platform-gates.html',  section: 'Reference' },
    { title: 'Design Contract',           href: 'design-contract.html', section: 'Reference' },
    { title: 'Inter font system',        href: 'design-contract.html', section: 'Reference' },
    { title: 'shadcn/ui components',     href: 'design-contract.html', section: 'Reference' },
    { title: 'CLAUDE.md bootstrap',     href: 'quickstart.html',      section: 'Getting Started' },
    { title: 'Multi-tool sync script',   href: 'quickstart.html',      section: 'Getting Started' },
    { title: 'sync-agent-rules.sh',     href: 'quickstart.html',      section: 'Getting Started' },
    { title: 'Pipeline Scripts Reference', href: 'scripts.html',      section: 'Reference' },
    { title: '!replay command',          href: 'commands.html',        section: 'Reference' },
    { title: '!fork command',            href: 'commands.html',        section: 'Reference' },
    { title: '!merge command',           href: 'commands.html',        section: 'Reference' },
    { title: '!migration-approve',       href: 'commands.html',        section: 'Reference' },
    { title: 'Suggestion Tracker',       href: 'suggestions.html',     section: 'Reference' },
    { title: 'Parallel Task Execution',  href: 'architecture.html',    section: 'Getting Started' },
    { title: 'Staged Write Overlay',     href: 'builder.html',         section: 'Agents' },
    { title: 'Secret Scanning',          href: 'builder.html',         section: 'Agents' },
    { title: 'Coverage Enforcement',     href: 'builder.html',         section: 'Agents' },
    { title: 'Container Verification',   href: 'verifier.html',        section: 'Agents' },
    { title: 'Session Forking',          href: 'orchestrator.html',    section: 'Agents' },
    { title: 'Pipeline Replay',          href: 'orchestrator.html',    section: 'Agents' },
    // Security Domains
    { title: 'Security Domains — all 20', href: 'security-domains.html', section: 'Agents' },
    { title: 'Domain 1 — Defense in Depth', href: 'security-domains.html#domain-1', section: 'Agents' },
    { title: 'Domain 2 — IAM',           href: 'security-domains.html#domain-2', section: 'Agents' },
    { title: 'Domain 3 — Session Security', href: 'security-domains.html#domain-3', section: 'Agents' },
    { title: 'Domain 4 — Network Security', href: 'security-domains.html#domain-4', section: 'Agents' },
    { title: 'Domain 5 — Input Validation', href: 'security-domains.html#domain-5', section: 'Agents' },
    { title: 'Domain 6 — Cryptography',  href: 'security-domains.html#domain-6', section: 'Agents' },
    { title: 'Domain 7 — Data Protection & PII', href: 'security-domains.html#domain-7', section: 'Agents' },
    { title: 'Domain 8 — Supply Chain',  href: 'security-domains.html#domain-8', section: 'Agents' },
    { title: 'Domain 9 — Logging & Monitoring', href: 'security-domains.html#domain-9', section: 'Agents' },
    { title: 'Domain 10 — Error Handling', href: 'security-domains.html#domain-10', section: 'Agents' },
    { title: 'Domain 11 — Tenant Isolation', href: 'security-domains.html#domain-11', section: 'Agents' },
    { title: 'Domain 12 — Release Integrity', href: 'security-domains.html#domain-12', section: 'Agents' },
    { title: 'Domain 13 — Client-Side Secrets', href: 'security-domains.html#domain-13', section: 'Agents' },
    { title: 'Domain 14 — External Surface', href: 'security-domains.html#domain-14', section: 'Agents' },
    { title: 'Domain 15 — Security Tests', href: 'security-domains.html#domain-15', section: 'Agents' },
    { title: 'Domain 16 — Privacy & Compliance', href: 'security-domains.html#domain-16', section: 'Agents' },
    { title: 'Domain 17 — Incident Response', href: 'security-domains.html#domain-17', section: 'Agents' },
    { title: 'Domain 18 — Electron/Tauri IPC', href: 'security-domains.html#domain-18', section: 'Agents' },
    { title: 'Domain 19 — React Native Bridge', href: 'security-domains.html#domain-19', section: 'Agents' },
    { title: 'Domain 20 — Express API Security', href: 'security-domains.html#domain-20', section: 'Agents' },
    { title: '!security domain [N]',     href: 'security-domains.html', section: 'Agents' },
    { title: '!security accept [ID]',    href: 'security-domains.html', section: 'Agents' },
    { title: '!security --full',         href: 'security-domains.html', section: 'Agents' },
    { title: 'OSV.dev vulnerability scan', href: 'security-domains.html#domain-8', section: 'Agents' },
    { title: 'NIST NVD CVE lookup',      href: 'security-domains.html#domain-8', section: 'Agents' },
    { title: 'GitGuardian secret scan',  href: 'security-domains.html#domain-13', section: 'Agents' },
    // Parallel Execution
    { title: 'Parallel Execution',       href: 'parallel-execution.html', section: 'Features' },
    { title: 'Go Goroutine Runner',      href: 'parallel-execution.html', section: 'Features' },
    { title: 'parallel_runner.go',       href: 'parallel-execution.html', section: 'Features' },
    { title: 'Sub-Agent Spawning',       href: 'parallel-execution.html', section: 'Features' },
    { title: 'Parallelism Map',          href: 'parallel-execution.html', section: 'Features' },
    { title: 'Pipeline Forking !fork',   href: 'parallel-execution.html', section: 'Features' },
    { title: 'session_fork.py',          href: 'parallel-execution.html', section: 'Features' },
    { title: '!merge fork-a',            href: 'parallel-execution.html', section: 'Features' },
    { title: 'Pipeline Replay !replay',  href: 'parallel-execution.html', section: 'Features' },
    { title: 'pipeline_replay.py',       href: 'parallel-execution.html', section: 'Features' },
    { title: 'Build progress bar',       href: 'parallel-execution.html', section: 'Features' },
    { title: 'RARV cycle',               href: 'parallel-execution.html', section: 'Features' },
    { title: 'Staged Write Overlay',     href: 'parallel-execution.html', section: 'Features' },
    // Token Budget
    { title: 'Token Budget !budget',     href: 'token-budget.html',    section: 'Features' },
    { title: 'token_tracker.py',         href: 'token-budget.html',    section: 'Features' },
    { title: 'Model pricing table',      href: 'token-budget.html',    section: 'Features' },
    { title: 'Per-agent cost breakdown', href: 'token-budget.html',    section: 'Features' },
    { title: 'session_tokens.jsonl',     href: 'token-budget.html',    section: 'Features' },
    { title: 'pricing.json',             href: 'token-budget.html',    section: 'Features' },
    { title: 'Model-adaptive behavior',  href: 'token-budget.html',    section: 'Features' },
    { title: 'Context window utilization', href: 'token-budget.html', section: 'Features' },
    // Context Management
    { title: 'Context Management',       href: 'context-management.html', section: 'Features' },
    { title: 'Rolling compression',      href: 'context-management.html', section: 'Features' },
    { title: '70% compression threshold', href: 'context-management.html', section: 'Features' },
    { title: 'CONTEXT_ARCHIVE.md',       href: 'context-management.html', section: 'Features' },
    { title: 'Repo Intelligence Maps',   href: 'context-management.html', section: 'Features' },
    { title: '.codeintel/ directory',    href: 'context-management.html', section: 'Features' },
    { title: 'codeintel.mjs',            href: 'context-management.html', section: 'Features' },
    { title: 'Symbol Index SYMBOL_INDEX.md', href: 'context-management.html', section: 'Features' },
    { title: 'Semantic search',          href: 'context-management.html', section: 'Features' },
    { title: 'semantic_search.py',       href: 'context-management.html', section: 'Features' },
    // Error Memory
    { title: 'Error Memory KNOWN_ERRORS', href: 'error-memory.html',  section: 'Features' },
    { title: '!error-add',               href: 'error-memory.html',   section: 'Features' },
    { title: '!error-check',             href: 'error-memory.html',   section: 'Features' },
    { title: 'KNOWN_ERRORS_INDEX.md',    href: 'error-memory.html',   section: 'Features' },
    { title: 'Failure mode classification', href: 'error-memory.html', section: 'Features' },
    { title: 'Repair loop 5 attempts',   href: 'error-memory.html',   section: 'Features' },
    { title: 'FAILURE_REPORT_TEMPLATE', href: 'error-memory.html',    section: 'Features' },
    // MCP Catalog
    { title: 'MCP Catalog',              href: 'mcp-catalog.html',    section: 'Features' },
    { title: '!mcp-catalog',             href: 'mcp-catalog.html',    section: 'Features' },
    { title: '!mcp-add',                 href: 'mcp-catalog.html',    section: 'Features' },
    { title: '!mcp-disable',             href: 'mcp-catalog.html',    section: 'Features' },
    { title: 'MCP risk tiers',           href: 'mcp-catalog.html',    section: 'Features' },
    { title: 'Context7 MCP',             href: 'mcp-catalog.html',    section: 'Features' },
    { title: 'Playwright MCP',           href: 'mcp-catalog.html',    section: 'Features' },
    { title: 'Neon MCP',                 href: 'mcp-catalog.html',    section: 'Features' },
    { title: 'GitHub MCP',               href: 'mcp-catalog.html',    section: 'Features' },
    // Component Libraries
    { title: 'Component Libraries',      href: 'components.html',     section: 'Features' },
    { title: 'Boron admin template',     href: 'components.html',     section: 'Features' },
    { title: 'Materialize Material Design', href: 'components.html',  section: 'Features' },
    { title: 'COMPONENT_CATALOG.md',     href: 'components.html',     section: 'Features' },
    { title: 'Component library resolution', href: 'components.html', section: 'Features' },
    { title: 'Storybook integration',    href: 'components.html',     section: 'Features' },
    { title: 'Story naming convention',  href: 'components.html',     section: 'Features' },
    // CIA System
    { title: 'CIA Capability Intelligence', href: 'cia-system.html',  section: 'Agents' },
    { title: 'CIA-1 Domain Scan',        href: 'cia-system.html',     section: 'Agents' },
    { title: 'CIA-2 Flow Scan',          href: 'cia-system.html',     section: 'Agents' },
    { title: 'CIA-3 Integration Scan',   href: 'cia-system.html',     section: 'Agents' },
    { title: 'CIA-4 Pre-Spec Final Scan', href: 'cia-system.html',    section: 'Agents' },
    { title: 'Capability Intercepts',    href: 'cia-system.html',     section: 'Agents' },
    { title: 'Market Validation Layer',  href: 'cia-system.html',     section: 'Agents' },
    { title: 'INCLUDE CONSIDER OPTIONAL', href: 'cia-system.html',   section: 'Agents' },
    // CLI Integrations
    { title: 'CLI Integrations',         href: 'cli-integrations.html', section: 'Getting Started' },
    { title: 'Cursor integration',       href: 'cli-integrations.html', section: 'Getting Started' },
    { title: 'GitHub Copilot integration', href: 'cli-integrations.html', section: 'Getting Started' },
    { title: 'Cline integration',        href: 'cli-integrations.html', section: 'Getting Started' },
    { title: 'Continue integration',      href: 'cli-integrations.html', section: 'Getting Started' },
    { title: 'Kiro integration',         href: 'cli-integrations.html', section: 'Getting Started' },
    { title: 'OpenCode integration',     href: 'cli-integrations.html', section: 'Getting Started' },
    { title: 'detect-and-install.mjs',   href: 'cli-integrations.html', section: 'Getting Started' },
    { title: 'sync-agent-rules.sh',      href: 'cli-integrations.html', section: 'Getting Started' },
    { title: 'MANIFEST.json',            href: 'cli-integrations.html', section: 'Getting Started' },
    // Artifacts Reference
    { title: 'Artifacts Reference',      href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'feature-spec.md',          href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'TDD.md Technical Design',  href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'TDD.md Technical Design',  href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'INTERFACES.md',            href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'SCHEMA.md',                href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'WRITE_LOG.jsonl',          href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'tasks.jsonl telemetry',    href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'COVERAGE_LOG.md',          href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'CRITICISM.md',             href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'SECURITY_REPORT.md',       href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'VERIFICATION_REPORT.md',   href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'SAST_FINDINGS.jsonl',      href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'SECRET_BLOCKS.jsonl',      href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'DONE_CRITERIA.md',         href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'REVIEW_RUBRIC.md',         href: 'artifacts-reference.html', section: 'Reference' },
    { title: 'Pipeline vs Project namespace', href: 'artifacts-reference.html', section: 'Reference' },
  ];

  /* ── Active Page Detection ────────────────────────────── */
  function getActivePage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename === '' ? 'index.html' : filename;
  }

  /* ── Build Header ─────────────────────────────────────── */
  function buildHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    header.innerHTML = `
      <a class="header-logo" href="index.html">
        <div class="logo-box">CS</div>
        <span class="header-logo-text">CodeSleuth AI</span>
      </a>
      <div class="header-search" id="header-search-wrap">
        <svg class="header-search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5 17.5l-4.167-4.167M13.333 8.333A5 5 0 1 1 3.333 8.333a5 5 0 0 1 10 0z"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
        <input type="text" id="search-input" placeholder="Search docs…" autocomplete="off" />
        <div class="search-results" id="search-results"></div>
      </div>
      <span class="version-badge">v3.0.0</span>
    `;

    setupSearch();
  }

  /* ── Build Sidebar ────────────────────────────────────── */
  function buildSidebar() {
    const sidebar = document.getElementById('site-sidebar');
    if (!sidebar) return;

    const active = getActivePage();
    let html = '';

    NAV.forEach(function (group) {
      html += `<div class="nav-group"><div class="nav-group-label">${group.group}</div>`;
      group.items.forEach(function (item) {
        const isActive = item.href === active;
        html += `
          <a class="nav-item${isActive ? ' active' : ''}" href="${item.href}">
            <span class="nav-item-icon">${item.icon}</span>
            ${item.label}
          </a>`;
      });
      html += `</div>`;
    });

    sidebar.innerHTML = html;
  }

  /* ── Search ───────────────────────────────────────────── */
  function setupSearch() {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!input || !results) return;

    input.addEventListener('input', function () {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        results.classList.remove('active');
        results.innerHTML = '';
        return;
      }

      const matches = SEARCH_INDEX.filter(function (item) {
        return item.title.toLowerCase().includes(q) ||
               item.section.toLowerCase().includes(q);
      }).slice(0, 8);

      if (matches.length === 0) {
        results.innerHTML = `<div class="search-no-results">No results for "<strong>${escapeHtml(q)}</strong>"</div>`;
      } else {
        results.innerHTML = matches.map(function (item) {
          return `
            <a class="search-result-item" href="${item.href}">
              <span class="search-result-title">${highlightMatch(item.title, q)}</span>
              <span class="search-result-section">${item.section}</span>
            </a>`;
        }).join('');
      }

      results.classList.add('active');
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (!document.getElementById('header-search-wrap').contains(e.target)) {
        results.classList.remove('active');
      }
    });

    /* Keyboard navigation */
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        results.classList.remove('active');
        input.blur();
      }
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function highlightMatch(text, query) {
    const escaped = escapeHtml(text);
    const re = new RegExp('(' + escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return escaped.replace(re, '<strong>$1</strong>');
  }

  /* ── Init ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    buildHeader();
    buildSidebar();
  });

})();
