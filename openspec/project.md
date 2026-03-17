# OinkBrew — Project Context

## Overview

OinkBrew is a brewing and fermentation control system comprising three components: a NestJS backend API, Particle IoT device firmware, and an iOS mobile app. The backend serves as the central hub — bridging the iOS app (user interface) with Particle Cloud (device communication) and persisting all data in MongoDB.

## Architecture

```
┌─────────────────┐     HTTP/SSE      ┌─────────────────┐     Particle Cloud     ┌─────────────────┐
│   mobile_ios    │ ◄──────────────►  │     backend     │ ◄──────────────────►   │    firmware     │
│   (Swift/iOS)   │   REST + JWT      │  (NestJS/Mongo) │   Events + Commands    │ (Particle C++)  │
└─────────────────┘                   └─────────────────┘                        └─────────────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │  MongoDB (repl) │
                                      └─────────────────┘
```

- **mobile_ios → backend**: REST API with JWT auth (access/refresh tokens, OTP 2FA)
- **backend → Particle Cloud**: Device sync, function calls, event subscriptions
- **firmware → Particle Cloud**: Publishes sensor data events, receives configuration commands

## Tech Stack

### Backend (`backend/`)
- **Runtime**: Node.js 20 (Alpine)
- **Framework**: NestJS 11.x, TypeScript 5.9
- **Database**: MongoDB 7.0.8 (3-node replica set via Mongoose 9.x)
- **Auth**: JWT (access + refresh tokens), Passport, Argon2 password hashing, OTP/2FA via otplib
- **Queue**: Bull 4.x with Redis 7.2.x for background jobs
- **IoT**: particle-api-js for Particle Cloud integration
- **Build**: SWC compiler for fast transpilation
- **Test**: Jest with @swc/jest, supertest for E2E, faker for test data
- **Lint/Format**: ESLint 9.x (@typescript-eslint), Prettier (single quotes, trailing commas, 100 char width)

### Mobile iOS (`mobile_ios/`)
- **Language**: Swift 5.0, SwiftUI
- **Target**: iOS 15.0+
- **Architecture**: MVVM (Views, ViewModels with @Published/@MainActor, Models, Services)
- **Dependencies**: CocoaPods (migrating to SPM) — Argon2Swift, SwiftOTP, Fakery, Mocker
- **Auth**: JWT token storage via SecureTokenStorage, auto-refresh
- **Key screens**: SignIn/SignUp, Configurations (list/detail/add/chart/settings), Devices (list/detail), Preferences, Side menu navigation

### Firmware (`firmware/`)
- **Platform**: Particle IoT (Photon/Electron)
- **Language**: C++ (Wiring/Arduino style)
- **Controllers**: BrewController, FridgeController with PID control
- **Sensors**: Dallas OneWire temperature sensors (DS18B20)
- **Actuators**: Digital and PWM (heating, cooling, pumps, fans)
- **Cloud events**: Publishes `oinkbrew/start`, `oinkbrew/devices/new`, `oinkbrew/device/values`; receives config via `setConfig` function

## Infrastructure

- **Docker Compose**: Development environment with backend, MongoDB replica set (3 nodes), Redis, and init scripts
- **E2E**: Separate docker-compose-e2e.yml with isolated MongoDB instances
- **Ports**: Backend 3000, MongoDB 27021-27023 (dev) / 27026-27028 (e2e), Redis 6379

## Domain Concepts

- **Device**: A Particle IoT hardware unit with connected sensors and actuators
- **Configuration**: A Brew or Fridge/Ferment control profile assigned to a device, defining temperature targets, PID parameters, and connected sensors/actuators
- **Sensor Data**: Time-series temperature readings from device sensors, attached to configurations
- **SSE**: Server-Sent Events for real-time sensor data streaming from backend to mobile app

## Code Conventions

- **Commit messages**: `[SCOPE]: Description` where scope is BACKEND, MOBILE, FIRMWARE, or CHORE
- **Backend structure**: Feature-based modules (auth, devices, configurations, listener, users, common)
- **Backend naming**: camelCase variables, PascalCase classes, DTOs for validation (class-validator)
- **iOS structure**: MVVM with separate Views/, ViewModels/, Models/, Services/, Screens/, Styles/
- **iOS naming**: camelCase properties/methods, PascalCase types, async/await for API calls
- **Import ordering** (backend): @nestjs → rxjs → mongoose → third-party → relative

## Git Workflow

- **Main branch**: `main`
- **Feature branches**: Named by feature area (e.g., `mobile-ui-devices`)
- **No CI/CD pipeline currently configured**

## Current Status

- Backend API is feature-complete for devices, configurations, auth, sensor data, and Particle event handling
- iOS app has device management, configuration list/archive/search, auth flow; in-progress: add configuration, chart/SSE, advanced config editing
- Firmware handles brew/fridge control, sensor reading, and Particle Cloud communication
