# OinkBrew — Project Overview

OinkBrew is a brewing/fermentation control system that connects **Particle IoT devices** (firmware), a **NestJS backend** (API + Particle integration), and an **iOS app** (mobile_ios) for configuration and monitoring. This document describes the three main projects and how they work together.

---

## Architecture at a Glance

```
┌─────────────────┐     HTTP/SSE      ┌─────────────────┐     Particle Cloud     ┌─────────────────┐
│   mobile_ios    │ ◄──────────────►  │     backend     │ ◄──────────────────►  │    firmware     │
│   (Swift/iOS)   │   REST + Auth     │  (NestJS/Mongo) │   Events + Commands    │ (Particle C++)  │
└─────────────────┘                   └─────────────────┘                        └─────────────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │  MongoDB (repl)  │
                                      └─────────────────┘
```

- **mobile_ios** talks to **backend** over HTTP (REST + optional SSE for live sensor data).
- **backend** talks to **Particle Cloud** (devices, events, function calls); **firmware** runs on Particle hardware and uses the same cloud for events and configuration.

---

## 1. Backend

**Path:** `backend/`  
**Stack:** NestJS, TypeScript, MongoDB (Mongoose), Particle API, JWT auth (access/refresh/OTP), Bull (queues).

### Purpose

- **REST API** for users, devices, and configurations (Brew / Fridge).
- **Particle integration:** sync devices from Particle, send configurations and commands to devices, subscribe to device events.
- **Persistence:** devices, configurations, sensor data, and users in MongoDB.

### Main capabilities

| Area | Description |
|------|-------------|
| **Auth** | Sign up, sign in, logout, refresh, OTP (e.g. 2FA). JWT access/refresh tokens. |
| **Devices** | `GET /devices`, `PUT /devices/refresh` (from Particle), `PUT /devices/{id}` (name/notes), `PUT /devices/{id}/restart`, sensor pin/hw_address updates. |
| **Configurations** | CRUD for Brew/Ferment configs: `GET/POST/PUT/DELETE /configurations`, assignment to devices, validation. |
| **Sensor data** | `GET /configurations/{id}/sensordata`, `SSE /configurations/{id}/sse` for live stream. |
| **Particle events** | Listener for `oinkbrew/start`, `oinkbrew/new`, `oinkbrew/device/values`; pushes config to device, applies offsets, stores sensor data. |

### Key structure

- `src/auth/` — auth controller, JWT strategies, guards, DTOs.
- `src/devices/` — devices controller/service, Particle sync, processor (events).
- `src/configurations/` — configurations controller/service, schemas (Brew/Fridge), validation.
- `src/listener/` — Particle event listener (e.g. `particle-event.listener.ts`).
- `src/users/` — user schema and service.
- `src/common/` — e.g. Particle service, shared types.
- Docs: `iot-configuration-data.md` (payloads sent to device), `iot-receive-data.md` (events from device).

### Running

- **Dependencies:** Node, npm, MongoDB (e.g. via repo `docker-compose.yml`).
- **Commands:** `npm install`, then `npm run start:dev` (or use Docker backend service).
- **E2E:** `npm run test:e2e` (uses `docker-compose-e2e.yml`).

### Configuration defaults

Brew and Fridge default values (temperature, PWM, PID, periods, etc.) are documented in `backend/README.md` and applied when creating configurations.

---

## 2. Firmware

**Path:** `firmware/`  
**Stack:** C++ (Particle / Arduino-style), Particle Cloud.

### Purpose

Runs on **Particle hardware** (e.g. Photon/Electron) to:

- Manage **Brew** and **Fridge** controllers (temperature, heating/cooling, pumps/fans).
- Read **OneWire/Dallas temperature sensors** and drive **actuators** (heat, PWM, digital).
- Receive **configuration and offsets** from the backend via Particle Cloud (events/function calls) and report **sensor values** and lifecycle events back.

### Main structure

| Folder/File | Role |
|-------------|------|
| `src/brewpi-brew.ino`, `brewpi-brew.cpp` | Main entry, setup/loop. |
| `src/ConfigManager.cpp/.h` | Persistence and application of configuration from cloud. |
| `src/controller/` | `BrewController`, `FridgeController`, `ControllerManager`, PID. |
| `src/devices/` | `DeviceManager`, `DallasTemperatureSensor`, `DigitalActuator`, `PwmActuator`, OneWire. |
| `src/config/ShieldSpark.*` | Board/shield configuration. |

### Interaction with backend

- Backend sends **setConfig**-style payloads (see `backend/iot-configuration-data.md`): OFFSET, UPDATE_CONFIGURATION, REMOVE_CONFIGURATION, RESTART.
- Firmware publishes events consumed by the backend (see `backend/iot-receive-data.md`): e.g. `oinkbrew/start`, `oinkbrew/devices/new`, `oinkbrew/devices/remove`, `oinkbrew/device/values`.

### Building

- Particle CLI or Particle Desktop IDE; compile with `particle compile <platform>`.
- Source and libs under `src/` and `project.properties` are used for cloud compile.

---

## 3. Mobile iOS

**Path:** `mobile_ios/`  
**Stack:** Swift, SwiftUI, Xcode.

### Purpose

iOS app for users to:

- **Sign in / sign up** against the backend (JWT).
- **Manage configurations** (Brew/Ferment): list, create, edit, archive, view details and advanced parameters.
- **View and manage devices** (list, detail, rename with sync to backend/cloud).
- **View sensor data** and (when implemented) **live updates via SSE**.
- **Settings / preferences** (e.g. default parameters, API URL).

### Main structure

| Area | Contents |
|------|----------|
| **Screens** | `HomeScreen`, `SideMenuScreen`, `PreferenceScreen`, `SignInScreen`, `SignUpScreen`. |
| **Views** | Configurations (list/row/detail/chart/settings), Devices (list/row/detail), modals, side menu. |
| **ViewModels** | `ConfigurationsViewModel`, `DevicesViewModel`, `PreferenceViewModel`, `UserStateViewModel`. |
| **Services** | `ApiServices.swift` — REST calls to backend (configurations, devices, auth). |
| **Models** | `BeerConfiguration`, `Device`, `ConnectedDevice`, etc. |

### Backend integration

- Base URL and auth (e.g. Bearer token) come from `Preferences`; tokens are used until 401 (TODO: persist until 401).
- Uses backend endpoints such as `/configurations`, `/devices` (and auth endpoints) as defined in the backend.

---

## How the three projects connect

| Link | Description |
|------|-------------|
| **Mobile → Backend** | REST API (auth, configurations, devices). Planned: SSE for configuration sensor stream. |
| **Backend → Particle Cloud** | Particle API: list devices, call device functions, subscribe to device events. |
| **Firmware ↔ Particle Cloud** | Publish events (start, new device, values); receive configuration/commands from backend via cloud. |
| **Backend → MongoDB** | Stores users, devices, configurations, sensor data. |

So: **mobile_ios** is the user interface; **backend** is the single backend and bridge to Particle; **firmware** is the device-side control and sensor/actuator logic.
