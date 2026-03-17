## ADDED Requirements

### Requirement: Backend runs on Node.js 22.22
The backend Docker container and local development environment SHALL use Node.js 22.22 as the minimum runtime version.

#### Scenario: Docker container uses Node 22.22
- **WHEN** the backend Docker image is built
- **THEN** it SHALL use the `node:22.22-alpine` base image

#### Scenario: Package.json enforces minimum Node version
- **WHEN** a developer runs `npm install` with a Node version below 22.22.0
- **THEN** npm SHALL warn about the unsupported engine version

#### Scenario: Type definitions match runtime version
- **WHEN** the backend TypeScript code is compiled
- **THEN** `@types/node` SHALL be pinned to `~22.22.0` to match the runtime
