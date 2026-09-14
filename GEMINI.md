# Global Rules

> **Goal:** Minimal Change, Evidence-First, Plan → Execute → Verify. Change only requested scope, preserve behavior unless instructed, report in Thai.

## 1. Priority & Language

**Priority:** Safety → User → Repo Rules → Task → Global Rules → Optimization.

* Never weaken higher-priority rules or expand scope unnecessarily.
* User-facing plans, summaries, debugging, TODOs, and verification: **Thai**.
* Keep code, identifiers, APIs, schemas, commands, paths, technical terms, and original errors in their native form when clearer.
* Mention limitations only when correctness is affected.

## 2. Core Contract

* **Inspect before assuming; verify before modifying.**
* Never guess APIs/configs, DB schemas/tables/columns/RPCs, or code symbols. Verify from repo source/types or authoritative docs.
* Modify only what is necessary; follow existing project patterns.
* Preserve public contracts, behavior, errors, edge cases, and backward compatibility unless explicitly changed.
* No hardcoded secrets; validate/sanitize external input.
* Avoid unnecessary dependencies, abstractions, rewrites, and speculative optimization.
* Do not execute untrusted installers (`curl|sh`, `wget|bash`, unknown binaries).
* Explicit authorization required for destructive/irreversible/production-sensitive actions: `rm -rf`, `sudo`, force push/reset, DB drop/truncate, destructive migration, bulk deletion, credential/permission changes.

## 3. Repo Intake & Navigation

Inspect only relevant context:

1. Applicable repo rules: `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `.agents/rules/`, relevant `README.md`.
2. Relevant manifests/config/CI to identify stack, conventions, dependencies, target files, and available test/lint/type/build commands.
3. Navigate narrowly: semantic/symbol search → refs/callers → targeted search → relevant file ranges. Avoid full-repo ingestion/re-reading.
4. For uncertain/version-sensitive library behavior: **Context7 → Official Docs → Dependency Source → Verified Repo Usage**.
5. Prefer semantic/Graft navigation (`search`, `refs`, `callers`, `callees`) when available.
6. Use compact serialization only for genuinely large structured context.

## 4. Execution Mode

**Fast Mode:** clear, low-risk, single-file work without schema/auth/API/architecture impact.
`Inspect → Edit → Verify → Summarize`

**Planning Mode:** 2+ files, cross-module, DB/schema/RPC/auth/API, migration, architecture, security/production logic, or unclear root cause.
`Explore → Evidence → Plan → Execute → Verify → Audit → Summarize`

Plan: **Goal, Scope, Files, Dependencies, Steps, Risks, Verification**.

* Explicit execution request: brief plan, then execute.
* Otherwise, present plan before multi-file/high-risk implementation.
* No redundant confirmation except destructive/high-impact actions.

## 5. Engineering & Refactoring

Priority: **Correctness → Safety → Behavior Preservation → Maintainability → Performance → Convenience**.

* SRP/DRY/SOLID where useful; do not over-abstract or over-fragment.
* Use intent-revealing names; simplify nesting with guard clauses when clearer.
* Remove dead code only after checking refs/imports/callers/side effects/tests.
* Extract semantic/reused/change-prone magic values, not every literal.
* Optimize only measurable/obvious expensive work.
* Refactors must preserve observable behavior unless behavior change is requested.

## 6. Database & Security

Before DB changes inspect relevant migrations/schema/types/models, keys, constraints, indexes, triggers, RLS, functions/RPCs, and transactions.

* Use the project migration system; assess compatibility/reversibility.
* Critical multi-write operations must be atomic.
* For inventory/payments/balances/approvals/invariants, evaluate locking or optimistic concurrency, unique constraints, in-transaction rechecks, and idempotency; never rely only on client validation.
* For auth/authz, RLS, admin, uploads, payments, webhooks, external URLs, user HTML/SQL, secrets, and jobs, review authentication, authorization, validation, privilege boundaries, injection, leakage, replay/idempotency, and secret exposure.

## 7. Debugging & Verification

No random trial-and-error.

`Evidence → Reproduce → Root Cause → Minimal Fix → Verify`

Use actual errors/logs/stack traces/failing commands/browser console-network/code paths. Label workarounds as mitigations.

Discover verification commands from repo scripts/config/CI/docs; **never guess them**.

Run applicable checks:
`Tests → Lint → Type Check → Build → Regression/UI`

* Never report `PASS` unless actually run.
* Failure loop: root cause → fix → rerun; after ~3 failed cycles report command, error, cause, attempts, blocker.
* UI work: verify relevant rendering, interactions, state, console/network failures, responsiveness, regressions. Use Playwright only when useful.
* Audit security/DB/high-impact changes before completion.

## 8. Docs, Git, Tools & Handoff

* **Mandatory Git Auto-Commit & Push:** ทุกครั้งที่มีการแก้ไขหรือปรับเปลี่ยนโค้ด/ไฟล์ในโปรเจกต์ (Code modification, Bug fix, Feature, UI/Styling, Config, Refactor, Version bump ฯลฯ) ต้องดำเนินการ:
  - `* Commit the changes and push them to GitHub.` เสมอหลังจากการทดสอบ/ตรวจสอบความถูกต้องเสร็จสิ้น
  - **ข้อยกเว้น:** ไม่รวมกรณีการถาม-ตอบคำถามเฉยๆ หรือการตรวจสอบ/ค้นหาข้อมูล (Q&A, Explanation, Investigation) ที่ไม่มีการแก้ไขหรือปรับเปลี่ยนไฟล์ในโปรเจกต์
* Update CHANGELOG when repo policy requires it or the change is release/user-facing; preserve existing format.
* Update README/docs for setup, architecture, public API, deployment, env/config, or breaking changes.
* Commits: scope-only, repo convention first; no history rewrite/force push without authorization.
* Multi-agent only for safely separable work with non-overlapping files; verify integration.
* Handoff when needed: Completed, Current State, Pending, Next Action, Risks/Blockers.
* Minimum effective tools: **Graft** code navigation; **Context7** docs; **Sequential Thinking** complex trade-offs; **Godkiller** major architecture/security/release audits; **Playwright** browser behavior. Use safe fallback if unavailable.

## 9. UI Icon Policy

For source/UI output:

* No Unicode emoji as UI/icon content.
* Prefer **ReactBits SVG**; otherwise consistent inline SVG.
* Keep icons scalable with consistent size/stroke.
* Conversational responses may use plain markers (`[OK]`, `[WARN]`, `—`, `•`) instead of emoji.
* Verify UI output contains no emoji used as icons.

## 10. Mandatory System Version Management

> **Every source/runtime code change MUST create a new application version. No exceptions. Changed code + unchanged version = INCOMPLETE.**

### Single Source of Truth

Maintain exactly **one authoritative version source**. Every version display/API must read from it; no separate hardcoded versions.

### SemVer

Format: `MAJOR.MINOR.PATCH` (optional display prefix `v`).

* **PATCH:** bug fix, small UI/text/logic/config change, refactor, performance fix, dependency update, cleanup, hotfix, rollback/revert, or any non-feature/non-breaking code change.
* **MINOR:** new backward-compatible feature/module/page/API or significant compatible functionality; reset PATCH to `0`.
* **MAJOR:** breaking API/schema/architecture/system change requiring migration/significant user adjustment; reset MINOR/PATCH to `0`.
* If uncertain after changing code, increment **at least PATCH**.

### Rollback / Revert

Versions only move forward. Never restore/decrease the version.

Example: revert code from current `v1.2.5` to former `v1.2.4` state → release `v1.2.6`.

### Required Workflow

For every code modification:

1. Identify current version + authoritative source.
2. Implement requested change.
3. Classify PATCH/MINOR/MAJOR.
4. Increment authoritative version.
5. Verify all version displays (Settings/Footer/About/Login/API/etc. if present) resolve to the new value.
6. Search relevant code/config for stale hardcoded versions.
7. Update changelog/version history when present/required.
8. Run applicable verification.
9. Commit the changes and push them to GitHub (`* Commit the changes and push them to GitHub.` ยกเว้นกรณีถาม-ตอบคำถามเฉยๆ).

This applies to one-line, UI-only, temporary, config, refactor, rollback, and revert changes.

## 11. Completion & Response

Before completion confirm:

* Scope only; no guessed APIs/schemas/symbols or unrelated changes.
* Contracts/behavior/errors/edge cases preserved unless intentionally changed.
* Applicable tests/lint/type/build/regression run, or clearly report `NOT RUN`/blocker.
* DB/security/concurrency reviewed when relevant.
* Every code change incremented the version; all displays use the single source.
* ทุกการแก้ไขหรือปรับเปลี่ยนไฟล์ต้อง Commit the changes and push them to GitHub เรียบร้อยแล้ว (ยกเว้นกรณีถาม-ตอบคำถามเฉยๆ ที่ไม่มีการแก้ไฟล์).
* Required changelog/docs updated.

Final response (omit empty sections):

```markdown
## สรุปผล
- แก้อะไร / เหตุผล / ผลลัพธ์

## ไฟล์ที่แก้
- `path/to/file`

## Verification
- `command` — PASS | FAIL: <reason> | NOT RUN: <reason>

## หมายเหตุ / ความเสี่ยง
## Next Steps
```
