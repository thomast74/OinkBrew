## Why

Configurations collect sensor data over time but there is no way to visualize this data in the mobile app. The `ConfigurationChartView` exists as a stub tab but shows nothing. Users need to see temperature trends to monitor and evaluate their brew/fridge sessions — both while active and after archiving.

## What Changes

- Raise minimum iOS deployment target from 15.0 to 16.0 to enable native Swift Charts framework
- Implement the `ConfigurationChartView` as a line chart displaying temperature sensor data over time
- Fetch historical sensor data via `GET /configurations/{id}/sensordata` on view load
- For active (non-archived) configurations, subscribe to real-time updates via `SSE /configurations/{id}/sse`
- For archived configurations, display only existing historical data (no SSE subscription)
- Show only temperature sensor data (`ONEWIRE_TEMP` type) as chart lines — actuators are excluded from the chart
- Highlight the configuration's primary `tempSensor` line in red
- Show the configuration's set temperature (`temperature` field) as a green reference line
- Display a legend below the chart with sensor names (from device's `connectedDevice.name`) and toggle controls to show/hide each line
- Include actuator data in the legend (with current value) but not as chart lines
- Legend layout supports up to 8 sensors/actuators

## Capabilities

### New Capabilities
- `sensor-data-chart`: Line chart visualization of configuration temperature sensor data with real-time updates, legend with toggle controls, and actuator status display

### Modified Capabilities

## Impact

- **Mobile iOS**: Raise deployment target from iOS 15.0 to iOS 16.0. New chart implementation in `ConfigurationChartView.swift`, new ViewModel for data fetching and SSE streaming, using native Swift Charts framework
- **Backend**: No changes expected — existing `GET /configurations/{id}/sensordata` and `SSE /configurations/{id}/sse` endpoints provide the required data
- **Models**: May need a sensor data response model on iOS side to parse the `ConfigurationSensorDatas` API response
