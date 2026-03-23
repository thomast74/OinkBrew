## ADDED Requirements

### Requirement: Active configurations display editable fields inline
For non-archived configurations, `ConfigurationSettingsView` SHALL display editable input controls instead of read-only property rows. Archived configurations SHALL continue to display read-only property rows.

#### Scenario: Active Brew configuration shows editable fields
- **WHEN** a non-archived Brew configuration is selected
- **THEN** the settings view displays editable controls for: name, temperature, temp sensor, heat actuator, heater PWM, heating period, pump1 actuator, pump1 PWM, pump2 actuator, pump2 PWM

#### Scenario: Active Fermentation configuration shows editable fields
- **WHEN** a non-archived Fermentation configuration is selected
- **THEN** the settings view displays editable controls for: name, temperature, temp sensor, heat actuator, cool actuator, fan actuator, fan PWM, cooling period, cooling on time, cooling off time, heating period

#### Scenario: Archived configuration remains read-only
- **WHEN** an archived configuration is selected
- **THEN** the settings view displays read-only property rows for all fields

### Requirement: Editable fields are pre-populated with current values
When displaying an active configuration, all editable fields SHALL be pre-populated with the configuration's current values.

#### Scenario: Fields show current configuration values
- **WHEN** a non-archived configuration is displayed
- **THEN** each editable field contains the configuration's current value for that field

### Requirement: Save button reflects dirty state
The Save button SHALL be disabled when no changes have been made. It SHALL be enabled once any field value differs from the original configuration.

#### Scenario: Save disabled with no changes
- **WHEN** a configuration is displayed and no fields have been modified
- **THEN** the Save button is disabled

#### Scenario: Save enabled after a change
- **WHEN** the user modifies any editable field
- **THEN** the Save button becomes enabled

#### Scenario: Save disabled after reverting changes
- **WHEN** the user modifies a field and then reverts it back to the original value
- **THEN** the Save button becomes disabled again

### Requirement: Unsaved changes indicator
The view SHALL display a visible message when there are unsaved changes.

#### Scenario: Unsaved changes message appears
- **WHEN** any field has been modified from its original value
- **THEN** a message indicating unsaved changes is displayed

#### Scenario: Unsaved changes message disappears after save
- **WHEN** the user saves changes successfully
- **THEN** the unsaved changes message is removed

### Requirement: Save persists changes via API
When the user taps Save, the system SHALL send the updated configuration to the backend via `PUT /configurations/{id}` and refresh the configurations list on success.

#### Scenario: Successful save
- **WHEN** the user taps Save with valid changes
- **THEN** the system sends a PUT request with the updated configuration body
- **THEN** the configurations list is refreshed from the API
- **THEN** the Save button becomes disabled (no unsaved changes)

#### Scenario: Save failure shows error
- **WHEN** the save API call fails
- **THEN** an error alert is displayed with the error message
- **THEN** the edited values remain in the form so the user can retry

### Requirement: Unsaved changes guard on navigation
When the user navigates away from a configuration with unsaved changes, the system SHALL present a confirmation dialog.

#### Scenario: Navigate away with unsaved changes
- **WHEN** the user has unsaved changes and attempts to navigate away (select another configuration or leave the detail view)
- **THEN** a confirmation dialog is shown with options to Save, Discard, or Cancel

#### Scenario: User chooses Save in confirmation
- **WHEN** the user selects "Save" in the confirmation dialog
- **THEN** the changes are saved via the API before navigation proceeds

#### Scenario: User chooses Discard in confirmation
- **WHEN** the user selects "Discard" in the confirmation dialog
- **THEN** the changes are discarded and navigation proceeds

#### Scenario: User chooses Cancel in confirmation
- **WHEN** the user selects "Cancel" in the confirmation dialog
- **THEN** the dialog closes and the user remains on the current configuration with their edits intact

### Requirement: Actuator and sensor pickers use fresh device data
When displaying editable actuator and sensor pickers, the system SHALL load current device data so pickers reflect connected hardware.

#### Scenario: Device data loaded on display
- **WHEN** the editable settings view appears for a non-archived configuration
- **THEN** device data is loaded from the API to populate actuator and sensor pickers

### Requirement: Validation rules match creation flow
Editable fields SHALL enforce the same validation rules as `AddConfigurationView`: name must be non-empty, heat actuator and temp sensor are required, cool actuator is required for Fermentation, and numeric values must be within valid ranges.

#### Scenario: Save disabled with invalid data
- **WHEN** a required field is empty or a numeric value is out of range
- **THEN** the Save button is disabled even if changes have been made
