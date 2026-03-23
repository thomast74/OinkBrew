## 1. Extract Shared Form Components

- [x] 1.1 Extract actuator picker, temp sensor picker, and slider field sub-components from `AddConfigurationView.swift` into standalone views under `Views/Configurations/` (e.g. `ActuatorPickerField.swift`, `TempSensorPickerField.swift`, `SliderField.swift`)
- [x] 1.2 Refactor `AddConfigurationView.swift` to use the extracted shared components
- [x] 1.3 Verify `AddConfigurationView` still works correctly after refactor

## 2. ViewModel Update Support

- [x] 2.1 Add `updateConfiguration(_ configuration: BeerConfiguration)` method to `ConfigurationsViewModel.swift` that calls `APIService.shared.updateConfiguration()` and refreshes the list on success (mirror `createConfiguration` pattern)

## 3. Editable ConfigurationSettingsView

- [x] 3.1 Add `@State` variables to `ConfigurationSettingsView.swift` for all editable fields, initialized from the configuration on appear
- [x] 3.2 Add `@EnvironmentObject` for `DevicesViewModel` and load fresh device data on appear
- [x] 3.3 Replace read-only `PropertyRow` fields with editable controls (text field, pickers, sliders) for non-archived configurations using the shared components from step 1
- [x] 3.4 Keep read-only `PropertyRow` display for archived configurations
- [x] 3.5 Implement `hasChanges` computed property that compares current state values against original configuration
- [x] 3.6 Implement validation logic (name non-empty, required actuators/sensors selected, numeric ranges) matching `AddConfigurationView` rules
- [x] 3.7 Add actuator exclusion logic (prevent same actuator selected in multiple pickers) using shared components

## 4. Save and Dirty State UI

- [x] 4.1 Add a "Save" toolbar button in `ConfigurationDetailView.swift`, visible for non-archived configurations, disabled when `hasChanges` is false or validation fails
- [x] 4.2 Implement save action: build updated `BeerConfiguration` from state, call `ConfigurationsViewModel.updateConfiguration()`, handle success (reset dirty state) and error (show alert)
- [x] 4.3 Add an inline unsaved changes message that appears when `hasChanges` is true

## 5. Navigation Guard

- [x] 5.1 Detect when the user navigates away (selects different configuration or leaves detail view) while `hasChanges` is true
- [x] 5.2 Show confirmation alert with Save, Discard, and Cancel options
- [x] 5.3 Implement Save option: persist changes then allow navigation
- [x] 5.4 Implement Discard option: reset state and allow navigation
- [x] 5.5 Implement Cancel option: dismiss alert, stay on current configuration

## 6. Preview and Testing

- [x] 6.1 Update `ConfigurationSettingsView` and `ConfigurationDetailView` previews to work with editable mode
- [x] 6.2 Verify Brew configuration edit flow end-to-end (modify fields, save, confirm API call)
- [x] 6.3 Verify Fermentation configuration edit flow end-to-end
- [x] 6.4 Verify archived configuration remains read-only
- [x] 6.5 Verify navigation guard triggers correctly with unsaved changes
