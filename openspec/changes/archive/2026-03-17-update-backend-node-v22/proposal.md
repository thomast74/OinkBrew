## Why

Node.js 20 enters maintenance mode in October 2026 and reaches end-of-life in April 2027. Node.js 22 is the current active LTS (since October 2024), bringing performance improvements, native fetch stability, and better ESM support. The project's `@types/node` is already targeting v22 (`^22.19.9`), so the runtime should match.

## What Changes

- Update `backend/Dockerfile` base image from `node:20-alpine` to `node:22.22-alpine`
- Add `engines` field to `backend/package.json` to enforce Node.js >=22.22.0
- Pin `@types/node` to `~22.22.0` to match the target runtime version

## Capabilities

### New Capabilities

_None — this is an infrastructure-only change with no new behavioral capabilities._

### Modified Capabilities

_None — no spec-level behavior changes._

## Impact

- **Dockerfile**: Base image changes from `node:20-alpine` to `node:22.22-alpine`
- **package.json**: New `engines` field to enforce minimum Node 22.22.0; `@types/node` pinned to `~22.22.0`
- **Dependencies**: All current dependencies already support Node 22 (NestJS 11.x requires `^18.19.1 || ^20.11.1 || >=22.0.0`)
- **Local development**: Developers should use Node 22.22+ locally
