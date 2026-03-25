## 1. Project Configuration

- [x] 1.1 Update Podfile `platform :ios` from `'15.0'` to `'17.6'` in `mobile_ios/Podfile`

## 2. Models

- [ ] 2.1 Create `SensorDataPoint` struct (`date: Date`, `name: String`, `value: Double`) in `mobile_ios/OinkBrew Mobile/Models/SensorDataPoint.swift`
- [ ] 2.2 Create `ConfigurationSensorDatas` response model in `mobile_ios/OinkBrew Mobile/Models/ConfigurationSensorDatas.swift` to decode `GET /configurations/{id}/sensordata` JSON (fields: `publishedAt`, `configurationId`, `sensorData` dictionary keyed by ISO8601 date strings)

## 3. API & SSE Services

- [ ] 3.1 Add `fetchSensorData(configurationId:)` method to `mobile_ios/OinkBrew Mobile/Services/ApiServices.swift` calling `GET /configurations/{id}/sensordata`
- [ ] 3.2 Implement SSE client using `URLSession` `bytes(for:)` async API — parse `event:`, `data:`, and empty-line delimiters from `GET /configurations/{id}/sse` stream

## 4. ViewModel

- [ ] 4.1 Create `ConfigurationChartViewModel` (`@MainActor class`, `ObservableObject`) in `mobile_ios/OinkBrew Mobile/ViewModels/ConfigurationChartViewModel.swift` with `@Published` properties for sensor data points, visibility toggles, and loading state
- [ ] 4.2 Implement parallel data loading: kick off REST fetch and SSE connection concurrently on `loadData()` call; skip SSE for archived configurations
- [ ] 4.3 Implement data transformation: parse REST response `Map<dateString, SensorData[]>` into flat `[SensorDataPoint]` array; append SSE events as they arrive
- [ ] 4.4 Implement deduplication using timestamp + sensor name composite key when inserting data points
- [ ] 4.5 Implement SSE health monitoring: track last event timestamp, close and reconnect SSE if no event received within 30 seconds
- [ ] 4.6 Implement SSE teardown on view disappear (cancel streaming task)
- [ ] 4.7 Implement sensor identification: classify each data series as temperature sensor or actuator by matching sensor name to configuration's connected devices and checking `deviceType`
- [ ] 4.8 Implement color assignment: red for primary `tempSensor`, distinct palette colors (blue, orange, purple, teal, brown, pink, indigo, cyan) for additional sensors, stable order by sensor name
- [ ] 4.9 Implement visibility toggle state: dictionary tracking which sensor lines are shown/hidden

## 5. Chart View

- [ ] 5.1 Replace stub in `mobile_ios/OinkBrew Mobile/Views/Configurations/ConfigurationChartView.swift` with Swift Charts `Chart` using `LineMark` for each visible temperature sensor series
- [ ] 5.2 Style primary `tempSensor` line in red with thicker line weight
- [ ] 5.3 Add green `RuleMark` horizontal line at the configuration's set temperature value
- [ ] 5.4 Apply assigned colors to additional temperature sensor lines via `foregroundStyle`
- [ ] 5.5 Wire up `onAppear` to start ViewModel data loading and `onDisappear` to stop SSE connection

## 6. Legend

- [ ] 6.1 Create legend grid layout below the chart showing colored circles, sensor names, and tap-to-toggle controls for temperature sensors
- [ ] 6.2 Display actuator entries in the legend with current value but no toggle control
- [ ] 6.3 Verify legend layout supports up to 8 sensors/actuators without overflow

## 7. Preview & Testing

- [ ] 7.1 Add preview data and SwiftUI preview for `ConfigurationChartView` with mock sensor data
