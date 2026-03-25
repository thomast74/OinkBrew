## ADDED Requirements

### Requirement: Chart displays temperature sensor data as line chart
The `ConfigurationChartView` SHALL render a line chart using Swift Charts showing temperature sensor data over time. The X-axis SHALL represent time (ISO8601 timestamps). The Y-axis SHALL represent temperature values. Only connected devices with `deviceType` of `oneWireTemp` (type 3) SHALL be rendered as chart lines. Actuator data SHALL NOT appear as chart lines.

#### Scenario: Chart renders temperature sensor lines
- **WHEN** the user navigates to the Chart tab of a configuration that has historical sensor data
- **THEN** the chart displays one line per temperature sensor (`ONEWIRE_TEMP` type) with time on the X-axis and temperature on the Y-axis

#### Scenario: Actuators excluded from chart lines
- **WHEN** the configuration has actuator devices (digital or PWM) with sensor data
- **THEN** no chart lines are rendered for actuator data

### Requirement: Historical sensor data loaded on view appear
The system SHALL fetch historical sensor data via `GET /configurations/{id}/sensordata` when the chart view appears. The response data (keyed by ISO8601 timestamps) SHALL be parsed into `SensorDataPoint` entries and displayed in the chart immediately.

#### Scenario: Historical data populates chart on load
- **WHEN** the user opens the Chart tab for a configuration
- **THEN** the system fetches `GET /configurations/{id}/sensordata` and renders all historical temperature data points in the chart

#### Scenario: No historical data available
- **WHEN** the user opens the Chart tab for a configuration with no sensor data
- **THEN** the chart displays an empty state with no lines

### Requirement: Real-time updates via SSE for active configurations
For non-archived configurations, the system SHALL establish an SSE connection to `GET /configurations/{id}/sse` concurrently with the historical data fetch when the chart view appears. New sensor data events SHALL be appended to the chart in real-time. The SSE connection SHALL be closed when the user navigates away from the configuration.

#### Scenario: SSE streams new data points to chart
- **WHEN** the chart view is active for a non-archived configuration and the backend sends a `SensorData` SSE event
- **THEN** the new data points are appended to the chart and the chart updates to show them

#### Scenario: SSE connection closed on view disappear
- **WHEN** the user navigates away from the configuration detail view
- **THEN** the SSE connection is closed

#### Scenario: Archived configurations do not establish SSE
- **WHEN** the user opens the Chart tab for an archived configuration
- **THEN** only historical data is fetched via REST; no SSE connection is established

### Requirement: SSE connection health monitoring with auto-reconnect
The system SHALL track the timestamp of the last received SSE event. If no event is received within 30 seconds of the last event, the system SHALL close the current SSE connection and establish a new one automatically. This monitoring SHALL continue as long as the chart view is active.

#### Scenario: Reconnect after 30-second timeout
- **WHEN** an active SSE connection has not received any event for 30 seconds
- **THEN** the system closes the current connection and opens a new SSE connection to `GET /configurations/{id}/sse`

#### Scenario: Timer resets on each received event
- **WHEN** an SSE event is received
- **THEN** the 30-second timeout timer resets

### Requirement: Duplicate data point deduplication
The system SHALL deduplicate sensor data points using the combination of timestamp and sensor name as a composite key. When a data point with the same timestamp and sensor name already exists, the duplicate SHALL be discarded.

#### Scenario: REST and SSE deliver overlapping data
- **WHEN** both the REST response and an SSE event contain a data point with the same timestamp and sensor name
- **THEN** only one data point is stored and displayed in the chart

### Requirement: Primary temperature sensor highlighted in red
The configuration's primary `tempSensor` line SHALL be rendered in red with a thicker line weight than other sensor lines.

#### Scenario: Primary sensor distinguished visually
- **WHEN** the chart displays multiple temperature sensor lines
- **THEN** the line corresponding to the configuration's `tempSensor` is red and visually thicker than other lines

### Requirement: Set temperature displayed as green reference line
The configuration's set temperature (`temperature` field) SHALL be displayed as a green horizontal reference line (`RuleMark`) on the chart.

#### Scenario: Reference line shown at set temperature
- **WHEN** the chart is displayed for a configuration with a set temperature value
- **THEN** a green horizontal line is drawn at the set temperature value across the full time range

### Requirement: Additional temperature sensors use distinct colors
Temperature sensor lines other than the primary `tempSensor` SHALL be assigned distinct colors from a predefined palette that excludes red and green: blue, orange, purple, teal, brown, pink, indigo, cyan. Colors SHALL be assigned in a stable order based on sensor name.

#### Scenario: Multiple sensors get distinct colors
- **WHEN** the chart displays three temperature sensors (primary + two additional)
- **THEN** the primary sensor is red and the two additional sensors each have a different color from the palette (e.g., blue and orange)

#### Scenario: Colors remain stable across data refreshes
- **WHEN** the chart data refreshes or new SSE data arrives
- **THEN** each sensor retains the same color it was previously assigned

### Requirement: Legend displays all sensors and actuators with toggle controls
A legend SHALL be displayed below the chart showing all sensors and actuators from the configuration. Each legend entry SHALL show a colored circle matching the sensor's chart color, the sensor name (from `connectedDevice.name`), and a tap-to-toggle control to show or hide the corresponding chart line. Actuators SHALL appear in the legend with their current value but SHALL NOT have chart lines. The legend layout SHALL support up to 8 sensors/actuators.

#### Scenario: Legend shows sensor entries with toggles
- **WHEN** the chart is displayed with temperature sensor data
- **THEN** each temperature sensor appears in the legend with its assigned color, name, and a toggle to show/hide its chart line

#### Scenario: Legend shows actuator entries without chart lines
- **WHEN** the configuration has actuator devices with data
- **THEN** actuators appear in the legend with their current value but tapping them does not toggle any chart line

#### Scenario: Toggling a sensor hides its chart line
- **WHEN** the user taps a temperature sensor's toggle in the legend to hide it
- **THEN** the corresponding line is removed from the chart and the toggle reflects the hidden state

#### Scenario: Legend supports up to 8 entries
- **WHEN** a configuration has 8 sensors and actuators
- **THEN** all 8 entries are displayed in the legend without layout overflow

### Requirement: Sensor data response model
The iOS app SHALL include a `ConfigurationSensorDatas` model to decode the `GET /configurations/{id}/sensordata` response. The model SHALL parse `publishedAt` (ISO8601 string), `configurationId` (number), and `sensorData` (dictionary keyed by ISO8601 date strings, each containing an array of `SensorData` with `name` and `value` fields).

#### Scenario: REST response decoded successfully
- **WHEN** the app receives a valid JSON response from `GET /configurations/{id}/sensordata`
- **THEN** the response is decoded into a `ConfigurationSensorDatas` instance with all timestamp-keyed sensor data entries

### Requirement: Podfile iOS deployment target updated
The Podfile's `platform :ios` SHALL be updated from `'15.0'` to `'17.6'` to align with the Xcode project's deployment target.

#### Scenario: Podfile reflects correct iOS target
- **WHEN** the Podfile is read
- **THEN** the platform line specifies iOS 17.6
