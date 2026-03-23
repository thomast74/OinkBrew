## Why

Users can create and view configurations but cannot edit them after creation. If a sensor, actuator, or setting needs to change, the only option is to archive the configuration and create a new one. This adds unnecessary friction, especially during brew/fermentation sessions where quick adjustments are common.

## What Changes

- Add an edit mode to the configuration detail view for non-archived configurations
- Brew configurations expose editable fields: name, temperature, temp sensor, heat actuator, heater PWM, heating period, pump1 actuator & PWM, pump2 actuator & PWM
- Fermentation configurations expose editable fields: name, temperature, temp sensor, heat actuator, cool actuator, fan actuator, fan PWM, cooling period, cooling on time, cooling off time, heating period
- Call the existing `PUT /configurations/{id}` backend endpoint to persist changes
- Update the ConfigurationsViewModel to support updating a configuration in the local list after a successful save

## Capabilities

### New Capabilities

- `edit-configuration`: Ability to edit fields of an active (non-archived) Brew or Fermentation configuration from the iOS detail view, with type-specific field sets and validation

### Modified Capabilities

## Impact

- **Views**: inline edit mode on `ConfigurationDetailView`/`ConfigurationSettingsView`
- **ViewModels**: `ConfigurationsViewModel` needs an update method to replace the edited configuration in the local list
- **API**: Uses existing `PUT /configurations/{id}` endpoint — no backend changes needed
- **Models**: `BeerConfiguration` already conforms to `ConfigurationBodyConvertible` — reuse `buildConfigurationRequestBody()` for the update payload
