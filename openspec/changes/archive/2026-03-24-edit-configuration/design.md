## Context

Users can create Brew and Fermentation configurations via `AddConfigurationView` (a modal sheet). Once created, configurations are displayed read-only in `ConfigurationSettingsView` using a `Form` with `PropertyRow` labels. The only mutation available is archive/unarchive. The backend already exposes `PUT /configurations/{id}` which accepts a full configuration body, and `BeerConfiguration` conforms to `ConfigurationBodyConvertible` for building request bodies.

## Goals / Non-Goals

**Goals:**
- Replace the read-only `ConfigurationSettingsView` with an always-editable form for non-archived configurations
- Pre-populate all editable fields from the current configuration values
- Support type-specific editable fields (Brew vs Fermentation)
- Provide a Save button that is disabled when no changes have been made; enabled once any field is modified
- Show a visual indicator (e.g. banner or inline message) when there are unsaved changes
- When the user navigates away with unsaved changes, show a confirmation dialog asking to save or discard
- Persist changes via `PUT /configurations/{id}` on save
- Archived configurations remain read-only

**Non-Goals:**
- Changing configuration type (Brew ↔ Fermentation) after creation
- Changing the device a configuration runs on after creation
- Editing archived configurations (must unarchive first)
- Modifying PID parameters (p, i, d) in this flow
- Backend changes — the existing update endpoint is sufficient

## Decisions

### 1. Always-editable form for active configurations

**Decision:** Transform `ConfigurationSettingsView` so that for non-archived configurations, editable fields are always shown as input controls (text fields, pickers, sliders). Archived configurations continue to show read-only `PropertyRow` display.

**Rationale:** Reduces friction — users can modify values immediately without an extra tap.

### 2. Dirty state tracking and Save button

**Decision:** Track whether any field differs from the original configuration. The Save button in the `ConfigurationDetailView` toolbar is disabled when there are no changes. When the form has unsaved changes, show an inline message (e.g. "You have unsaved changes") and enable the Save button.

**Rationale:** Clear feedback about dirty state prevents confusion. Disabling Save when clean prevents unnecessary API calls.

### 3. Unsaved changes guard on navigation

**Decision:** When the user navigates away (selects a different configuration or leaves the detail view) while changes are unsaved, present a confirmation alert with "Save", "Discard", and "Cancel" options.

**Rationale:** Prevents accidental data loss. Standard UX pattern for forms with unsaved state.

### 4. State management

**Decision:** Use `@State` variables in `ConfigurationSettingsView` initialized from the configuration on appear. Compute a `hasChanges` property by comparing current state to the original configuration values. On save, build an updated `BeerConfiguration` from the state and call the view model.

**Rationale:** Local state keeps edits isolated until save. Comparing against the original is straightforward since all fields are value types.

### 5. Device data for pickers

**Decision:** Load fresh device data via `DevicesViewModel` when the editable settings view appears, so actuator and sensor pickers reflect currently connected hardware.

**Rationale:** Same approach as `AddConfigurationView`. Ensures pickers show actual hardware state.

### 6. Reuse form components from AddConfigurationView

**Decision:** Extract shared sub-components (actuator picker, sensor picker, slider field) from `AddConfigurationView` into standalone views so both add and edit flows can reuse them.

**Rationale:** Both flows need identical picker and slider controls with the same validation and exclusion logic. Extracting avoids duplication.

## Risks / Trade-offs

- **Navigation guard complexity** → SwiftUI does not have a built-in "unsaved changes" guard. Will use `onChange` of the selected configuration or `onDisappear` combined with an alert to intercept navigation. May need to defer the navigation until the user responds.
- **View complexity** → `ConfigurationSettingsView` becomes more complex, but form components are shared with `AddConfigurationView`.
- **Stale device data** → Mitigated by loading fresh data on appear.
