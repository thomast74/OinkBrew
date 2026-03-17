## 1. Backend Docker

- [x] 1.1 Update `backend/Dockerfile` base image from `node:20-alpine` to `node:22.22-alpine`

## 2. Backend package.json

- [x] 2.1 Add `engines` field to `backend/package.json` with `"node": ">=22.22.0"`
- [x] 2.2 Update `@types/node` in `backend/package.json` devDependencies from `^22.19.9` to `~22.22.0`

## 3. Verification

- [x] 3.1 Build the Docker image and verify it starts successfully
- [x] 3.2 Run `npm test` to confirm all unit tests pass on Node 22.22
