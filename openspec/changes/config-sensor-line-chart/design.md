## Context

The mobile iOS app displays configuration details via a segmented picker with "Info" and "Chart" tabs. The Chart tab (`ConfigurationChartView`) is currently a stub showing placeholder text. The backend already provides both a REST endpoint (`GET /configurations/{id}/sensordata`) returning historical sensor data keyed by ISO8601 timestamps, and an SSE endpoint (`GET /configurations/{id}/sse`) streaming real-time `SensorData` events. No iOS-side SSE client or chart framework usage exists yet.

The project targets iOS 17.6 in the Xcode project (Podfile still declares 15.0). Sensor data from the backend arrives as `Map<dateString, SensorData[]>` where each `SensorData` has `name` (string) and `value` (number). Connected devices on a configuration include `tempSensor`, `heatActuator`, and optionally `coolActuator`, `fanActuator`, `pump1Actuator`, `pump2Actuator` — each with a `type` field mapping to `ConnectedDeviceType` (oneWireTemp=3, actuatorDigital=1, actuatorPWM=2).

## Goals / Non-Goals

**Goals:**

- Display temperature sensor data as a line chart using Swift Charts (available since iOS 16)
- Fetch historical data on view load and stream real-time updates for active configurations
- Provide a legend with toggle controls for showing/hiding individual sensor lines
- Highlight the primary `tempSensor` in red and show set temperature as a green reference line
- Show actuator status in the legend without charting them

**Non-Goals:**

- Charting actuator data (on/off or PWM values) as lines
- Zooming, panning, or custom time range selection
- Persisting chart display preferences across sessions
- Modifying any backend endpoints or data formats
- Supporting data export or sharing

## Decisions

### 1. Use Swift Charts framework (native)

Use Apple's native Swift Charts (`import Charts`) for the line chart. No third-party charting library needed.

**Why:** The project already targets iOS 17.6, well above the iOS 16 minimum for Swift Charts. Native framework means zero dependency overhead, better SwiftUI integration, and automatic support for accessibility and Dynamic Type.

**Alternatives considered:** Third-party libraries (e.g., swift-charts via SPM) — rejected because native Charts covers line chart needs and avoids adding a dependency.

### 2. Dedicated ConfigurationChartViewModel

Create a new `ConfigurationChartViewModel` following the existing MVVM pattern (`@MainActor class` with `@Published` properties). This ViewModel will:

- Hold the parsed sensor data time series
- Manage SSE connection lifecycle (connect on appear, disconnect on disappear)
- Track which sensor lines are visible (toggle state)
- Separate data fetching/streaming concerns from the view

**Why:** Consistent with the app's existing ViewModel pattern (e.g., `ConfigurationsViewModel`, `DevicesViewModel`). Keeps the view declarative and testable.

### 3. Parallel data loading: REST fetch + SSE stream on view appear

When the chart view appears, the ViewModel kicks off two concurrent operations:

1. **REST fetch** — `GET /configurations/{id}/sensordata` to load all existing historical sensor data. This populates the chart immediately.
2. **SSE connection** — `GET /configurations/{id}/sse` to receive all future sensor data events in real-time. New data points are appended to the chart as they arrive.

Both operations start simultaneously on view appear. When the user navigates away from the configuration (view disappears), the SSE connection is closed. For archived configurations, only the REST fetch is performed (no SSE connection since no new data will arrive).

The SSE client is implemented using `URLSession` with `bytes(for:)` async API to read the event stream line by line. No third-party EventSource library.

**Why:** Parallel loading gives the user immediate historical context while also ensuring no data gap — any events that occur during/after the REST fetch are captured by the SSE stream. The SSE protocol is simple (text lines with `data:` and `event:` prefixes), so a lightweight parser on top of `URLSession` avoids adding a dependency for ~30 lines of parsing code. The async/await approach fits the app's existing concurrency patterns.

**Alternatives considered:** Third-party EventSource libraries (e.g., LDSwiftEventSource) — rejected to keep dependencies minimal for a straightforward use case.

### 4. Data model for chart data points

Introduce a simple `SensorDataPoint` struct with `date: Date`, `name: String`, `value: Double` as the chart's data model. The ViewModel transforms the backend's `Map<dateString, SensorData[]>` response into a flat array of `SensorDataPoint` entries suitable for Swift Charts `LineMark`.

**Why:** Swift Charts works best with flat, identifiable data. A flat array grouped by `name` maps directly to `LineMark(x: .value("Time", date), y: .value("Temp", value)).foregroundStyle(by: .value("Sensor", name))`.

### 5. Sensor data response model on iOS side

Add a `ConfigurationSensorDatas` response model to parse the REST endpoint's JSON. The backend returns `{ publishedAt, configurationId, sensorData: { [date]: SensorData[] } }` where `sensorData` is a dictionary keyed by ISO8601 date strings.

**Why:** The existing iOS models don't include a sensor data response type. Needed for type-safe decoding of the historical data endpoint.

### 6. Sensor identification strategy

Match sensor data entries to configuration connected devices by `name` field. The backend stores sensor data with the device's `name` property. Determine if a data series is a temperature sensor (chart it) or an actuator (legend only) by looking up the corresponding `ConnectedDevice` on the configuration and checking its `deviceType`.

**Why:** The `SensorData` type from the backend only has `name` and `value`. The configuration's connected devices provide the type information needed to distinguish sensors from actuators.

### 7. Chart styling and color assignment

- **Primary `tempSensor` line:** Red, thicker line weight — always assigned first
- **Set temperature reference:** Green `RuleMark` horizontal line
- **Additional temperature sensor lines:** Assigned distinct colors from a predefined palette that avoids red and green. Colors are chosen for readability on both light and dark backgrounds: blue, orange, purple, teal, brown, pink, indigo, cyan. Colors are assigned in a stable order based on sensor name so they remain consistent across data refreshes.
- **Legend:** Grid layout below the chart with colored circles matching each sensor's assigned color, sensor names, and tap-to-toggle visibility controls. Actuators appear in the legend (with current value) but without chart lines.

**Why:** Red for primary sensor and green for target temperature are reserved for their specific roles. The remaining palette uses SwiftUI system colors that are visually distinct from each other and from red/green, ensuring readability with up to 8 sensors. Stable color assignment by name prevents colors from shifting when sensors come online or go offline.

### 8. Update Podfile iOS target to match Xcode project

Update the Podfile's `platform :ios` from `'15.0'` to `'17.6'` as specified in the proposal. The Xcode project already targets 17.6 so this is a documentation/CocoaPods alignment change.

**Why:** Aligns Podfile minimum with the Swift Charts requirement. No functional impact since the project already builds for 17.6.

### 9. SSE connection health monitoring and auto-reconnect

The ViewModel tracks the timestamp of the last received SSE event. Since sensor data arrives approximately every 10 seconds, a 30-second timeout is used to detect dropped connections. If no SSE event is received within 30 seconds of the last one, the current connection is considered dead — it is closed and a new SSE connection is established automatically. This cycle repeats as long as the chart view is active.

**Why:** SSE connections can drop silently due to network changes, server restarts, or intermediate proxies timing out. Without active monitoring, the chart would stop updating with no visible indication. A 30-second threshold (3x the expected data interval) avoids false positives from minor delays while detecting genuine drops promptly.

## Risks / Trade-offs

**Large historical datasets may cause UI lag** → Mitigate by processing data off the main thread (within the async ViewModel methods). If needed, downsample data points for very long sessions (future optimization, not in initial scope).

**Sensor name mismatches between config and data** → If the backend returns sensor data with a name not matching any connected device, display it as an "unknown" series in the chart. This is defensive — shouldn't happen in practice.

**No SSE client library means manual parsing** → The SSE protocol is simple but edge cases exist (multi-line data, comments, retry fields). Mitigate by handling the subset the backend actually sends (`event:`, `data:`, empty line as delimiter).

**Duplicate data points from REST + SSE overlap** → The REST fetch and SSE stream may briefly overlap, delivering the same timestamp. Mitigate by deduplicating on insert using the timestamp + sensor name as a composite key.
