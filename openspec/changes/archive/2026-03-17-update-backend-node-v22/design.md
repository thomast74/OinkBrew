## Context

The backend currently runs on Node.js 20 (Alpine) in Docker and has no `engines` constraint in `package.json`. The `@types/node` dependency is already pinned to `^22.19.9`, creating a mismatch between the type definitions and the actual runtime. All NestJS 11.x dependencies support Node 22 (`^18.19.1 || ^20.11.1 || >=22.0.0`).

## Goals / Non-Goals

**Goals:**
- Align the Docker runtime with the already-targeted Node 22 type definitions
- Add an `engines` field to `package.json` to document the minimum Node version
- Keep using Alpine variant for small image size

**Non-Goals:**
- Upgrading any npm dependencies (they already support Node 22)
- Changing the Docker Compose configuration or MongoDB/Redis versions
- Modifying the E2E Docker Compose setup (it doesn't define a backend service)

## Decisions

**Decision: Use `node:22.22-alpine` (minor-version pinned)**
- Alpine keeps the image small, consistent with current approach
- Pinning to minor version (`22.22`) ensures a known-good runtime while still receiving patch updates on rebuild
- Alternative considered: Using major-only tag (`node:22-alpine`) — rejected to ensure consistency with the engines constraint and `@types/node` version

**Decision: Use `>=22.22.0` in engines field**
- Enforces the specific minimum minor version matching the Docker image
- Alternative: `>=22.0.0` — rejected as too permissive; we want to ensure developers use at least 22.22

**Decision: Pin `@types/node` to `~22.22.0`**
- Aligns type definitions with the exact runtime minor version
- Tilde range (`~22.22.0`) allows patch updates but not minor bumps, keeping types in sync with the runtime

## Risks / Trade-offs

- [Native addon compatibility] → Low risk: `argon2` and other native modules support Node 22. The `@swc/core` binary also ships Node 22 builds.
- [Alpine musl libc] → Same risk as before since we're already on Alpine. No change in behavior.
- [Breaking runtime behavior] → Node 22 has no breaking changes that affect NestJS or the dependencies in use.
