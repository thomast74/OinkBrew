import SwiftUI

struct ConfigurationSettingsView: View {

    let configuration: BeerConfiguration
    @EnvironmentObject private var devicesViewModel: DevicesViewModel
    @EnvironmentObject private var configurationsViewModel: ConfigurationsViewModel

    // MARK: - Editable state (initialized from configuration in .onAppear)
    @State private var name: String = ""
    @State private var temperature: Double = 0
    @State private var heatActuator: ConnectedDevice?
    @State private var tempSensor: ConnectedDevice?
    @State private var heatingPeriod: Int = 0

    // Brew
    @State private var pump1Actuator: ConnectedDevice?
    @State private var pump2Actuator: ConnectedDevice?
    @State private var heaterPwm: Int = 0

    // Fermentation
    @State private var coolActuator: ConnectedDevice?
    @State private var fanActuator: ConnectedDevice?
    @State private var fanPwm: Int = 0
    @State private var coolingPeriod: Int = 0
    @State private var coolingOnTime: Int = 0
    @State private var coolingOffTime: Int = 0

    @State private var baseline: BeerConfiguration?
    @State private var isSaving = false
    @State private var showError = false
    @State private var errorMessage = ""

    private let isoFormatter: ISO8601DateFormatter

    init(configuration: BeerConfiguration) {
        self.configuration = configuration

        isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withFullDate, .withDashSeparatorInDate, .withTime, .withSpaceBetweenDateAndTime, .withColonSeparatorInTime]
    }

    // MARK: - Configuration type helper

    private var configurationType: BeerConfgurationType {
        BeerConfgurationType(rawValue: configuration.type) ?? .Brew
    }

    private var isEditable: Bool { !configuration.archived }

    // MARK: - Device data for pickers

    private var currentDevice: Device? {
        devicesViewModel.devices.first { $0.id == configuration.device.id }
    }

    private var actuators: [ConnectedDevice] {
        guard let device = currentDevice else { return [] }
        return device.connectedDevices.filter {
            $0.deviceType == .actuatorDigital || $0.deviceType == .actuatorPWM
        }
    }

    private var tempSensors: [ConnectedDevice] {
        guard let device = currentDevice else { return [] }
        return device.connectedDevices.filter { $0.deviceType == .oneWireTemp }
    }

    // MARK: - Actuator exclusion logic

    private var availableForHeatActuator: [ConnectedDevice] {
        if configurationType == .Brew {
            return actuators.filter { a in
                a.id != pump1Actuator?.id && a.id != pump2Actuator?.id
            }
        } else {
            return actuators.filter { a in
                a.id != coolActuator?.id && a.id != fanActuator?.id
            }
        }
    }

    private var availableForPump1: [ConnectedDevice] {
        actuators.filter { a in
            a.id != heatActuator?.id && a.id != pump2Actuator?.id
        }
    }

    private var availableForPump2: [ConnectedDevice] {
        actuators.filter { a in
            a.id != heatActuator?.id && a.id != pump1Actuator?.id
        }
    }

    private var availableForCoolActuator: [ConnectedDevice] {
        actuators.filter { a in
            a.id != heatActuator?.id && a.id != fanActuator?.id
        }
    }

    private var availableForFanActuator: [ConnectedDevice] {
        actuators.filter { a in
            a.id != heatActuator?.id && a.id != coolActuator?.id
        }
    }

    private func optionsIncludingSelection(available: [ConnectedDevice], current: ConnectedDevice?) -> [ConnectedDevice] {
        guard let current = current, !available.contains(where: { $0.id == current.id }) else {
            return available
        }
        return [current] + available
    }

    private var optionsForHeatActuator: [ConnectedDevice] {
        optionsIncludingSelection(available: availableForHeatActuator, current: heatActuator)
    }

    private var optionsForPump1: [ConnectedDevice] {
        optionsIncludingSelection(available: availableForPump1, current: pump1Actuator)
    }

    private var optionsForPump2: [ConnectedDevice] {
        optionsIncludingSelection(available: availableForPump2, current: pump2Actuator)
    }

    private var optionsForCoolActuator: [ConnectedDevice] {
        optionsIncludingSelection(available: availableForCoolActuator, current: coolActuator)
    }

    private var optionsForFanActuator: [ConnectedDevice] {
        optionsIncludingSelection(available: availableForFanActuator, current: fanActuator)
    }

    // MARK: - Validation (matches AddConfigurationView rules)

    private let temperatureRange: ClosedRange<Double> = 0 ... 100
    private let pwmRange: ClosedRange<Int> = 0 ... 100
    private let periodMin = 0

    private var isTemperatureValid: Bool { temperatureRange.contains(temperature) }
    private var isHeaterPwmValid: Bool { pwmRange.contains(heaterPwm) }
    private var isFanPwmValid: Bool { pwmRange.contains(fanPwm) }
    private var isHeatingPeriodValid: Bool { heatingPeriod >= periodMin }
    private var isCoolingPeriodValid: Bool { coolingPeriod >= periodMin }
    private var isCoolingOnTimeValid: Bool { coolingOnTime >= periodMin }
    private var isCoolingOffTimeValid: Bool { coolingOffTime >= periodMin }

    private var numericRangesValid: Bool {
        guard isTemperatureValid, isHeatingPeriodValid else { return false }
        if configurationType == .Brew {
            return isHeaterPwmValid
        } else {
            return isFanPwmValid && isCoolingPeriodValid && isCoolingOnTimeValid && isCoolingOffTimeValid
        }
    }

    var isValid: Bool {
        let nameOk = !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        let heatOk = heatActuator != nil
        let sensorOk = tempSensor != nil
        let requiredOk: Bool
        if configurationType == .Brew {
            requiredOk = nameOk && heatOk && sensorOk
        } else {
            requiredOk = nameOk && heatOk && sensorOk && coolActuator != nil
        }
        return requiredOk && numericRangesValid
    }

    // MARK: - Dirty state tracking

    var hasChanges: Bool {
        let base = baseline ?? configuration
        if name != base.name { return true }
        if temperature != base.temperature { return true }
        if heatActuator?.id != base.heatActuator.id { return true }
        if tempSensor?.id != base.tempSensor.id { return true }
        if heatingPeriod != base.heatingPeriod { return true }

        if configurationType == .Brew {
            if pump1Actuator?.id != base.pump1Actuator?.id { return true }
            if pump2Actuator?.id != base.pump2Actuator?.id { return true }
            if heaterPwm != (base.heaterPwm ?? 0) { return true }
        } else {
            if coolActuator?.id != base.coolActuator?.id { return true }
            if fanActuator?.id != base.fanActuator?.id { return true }
            if fanPwm != (base.fanPwm ?? 0) { return true }
            if coolingPeriod != (base.coolingPeriod ?? 0) { return true }
            if coolingOnTime != (base.coolingOnTime ?? 0) { return true }
            if coolingOffTime != (base.coolingOffTime ?? 0) { return true }
        }

        return false
    }
    
    var isSaveDisabled: Bool {
        return !hasChanges || !isValid || isSaving
    }
    
    var isSaveEnabled: Bool {
        return hasChanges && isValid && !isSaving
    }

    // MARK: - Navigation guard sync

    /// A fingerprint of all editable state, used to detect any field change via a single onChange.
    private var stateFingerprint: String {
        "\(name)|\(temperature)|\(heatActuator?.id ?? "")|\(tempSensor?.id ?? "")|\(heatingPeriod)|\(pump1Actuator?.id ?? "")|\(pump2Actuator?.id ?? "")|\(heaterPwm)|\(coolActuator?.id ?? "")|\(fanActuator?.id ?? "")|\(fanPwm)|\(coolingPeriod)|\(coolingOnTime)|\(coolingOffTime)"
    }

    private func syncNavigationGuardState() {
        let changed = hasChanges
        if configurationsViewModel.detailHasUnsavedChanges != changed {
            configurationsViewModel.detailHasUnsavedChanges = changed
        }
        configurationsViewModel.pendingSaveConfiguration = changed ? buildUpdatedConfiguration() : nil
    }

    /// Builds an updated BeerConfiguration from current state values.
    func buildUpdatedConfiguration() -> BeerConfiguration {
        var updated = configuration
        updated.name = name.trimmingCharacters(in: .whitespacesAndNewlines)
        updated.temperature = temperature
        updated.heatActuator = heatActuator ?? configuration.heatActuator
        updated.tempSensor = tempSensor ?? configuration.tempSensor
        updated.heatingPeriod = heatingPeriod

        if configurationType == .Brew {
            updated.pump1Actuator = pump1Actuator
            updated.pump2Actuator = pump2Actuator
            updated.heaterPwm = heaterPwm
        } else {
            updated.coolActuator = coolActuator
            updated.fanActuator = fanActuator
            updated.fanPwm = fanPwm
            updated.coolingPeriod = coolingPeriod
            updated.coolingOnTime = coolingOnTime
            updated.coolingOffTime = coolingOffTime
        }

        return updated
    }

    /// Resets state to match the current configuration values.
    func resetState() {
        populateState(from: configuration)
    }

    // MARK: - Body

    var body: some View {
        VStack {
            if isEditable {
                editableContent
            } else {
                readOnlyContent
            }
        }
        .onAppear {
            populateState(from: configuration)
            configurationsViewModel.detailHasUnsavedChanges = false
            configurationsViewModel.pendingSaveConfiguration = nil
            if isEditable {
                Task {
                    await devicesViewModel.loadDevices()
                    reconcileSelectionsWithDeviceData()
                }
            }
        }
        .onChange(of: stateFingerprint) { _, _ in
            syncNavigationGuardState()
        }
        .toolbar {
            if isEditable {
                ToolbarItem(placement: .title) {
                    Text(configurationsViewModel.detailHasUnsavedChanges ? "You have unsaved changes" : "")
                        .foregroundColor(.orange)
                        .font(.subheadline)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        save()
                    }
                    .foregroundColor(isSaveEnabled ? .blue : .gray)
                    .disabled(isSaveDisabled)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
    }

    private func save() {
        isSaving = true
        let updated = buildUpdatedConfiguration()
        Task {
            await configurationsViewModel.updateConfiguration(updated)
            await MainActor.run {
                isSaving = false
                if configurationsViewModel.hasError {
                    errorMessage = configurationsViewModel.errorMessage
                    showError = true
                } else {
                    baseline = updated
                    configurationsViewModel.detailHasUnsavedChanges = false
                    configurationsViewModel.pendingSaveConfiguration = nil
                }
            }
        }
    }

    // MARK: - Editable content

    private let labelWidth = 200.0
    private var editableContent: some View {
        Form {
            Section(header: Text("Basic Information")) {
                HStack(alignment: .center) {
                    Text("Name")
                        .frame(width: labelWidth, alignment: .leading)
                        .font(.headline)
                    TextField("Name", text: $name)
                        .textFieldStyle(.plain)
                        .autocapitalization(.words)
                        .multilineTextAlignment(.trailing)
                        .padding(.trailing, 16)
                }
                PropertyRow(label: "Device", value: configuration.device.name ?? "Unknown")
            }
            Section(header: Text("Settings")) {
                ActuatorPickerField(title: "Heat Actuator", selection: $heatActuator, options: optionsForHeatActuator, labelWidth: labelWidth)
                TempSensorPickerField(selection: $tempSensor, sensors: tempSensors, labelWidth: labelWidth)
                SliderField(label: "Set Temperature", labelShort: "C", value: $temperature, labelWidth: labelWidth, min: 0, max: 100, step: 0.5)
                if configurationType == .Brew {
                    brewEditableFields(labelWidth: labelWidth)
                } else {
                    fermentationEditableFields(labelWidth: labelWidth)
                }
            }
            Section(header: Text("Timestamps")) {
                PropertyRow(label: "Created At", value: isoFormatter.string(from: configuration.createdAt))
                PropertyRow(label: "Updated At", value: isoFormatter.string(from: configuration.updatedAt))
            }
        }
    }

    @ViewBuilder
    private func brewEditableFields(labelWidth: CGFloat) -> some View {
        SliderField(label: "Heater PWM", labelShort: "%", value: $heaterPwm, labelWidth: labelWidth, min: 1, max: 100, step: 1)
        ActuatorPickerField(title: "Pump 1 Actuator", selection: $pump1Actuator, options: optionsForPump1, labelWidth: labelWidth)
        ActuatorPickerField(title: "Pump 2 Actuator", selection: $pump2Actuator, options: optionsForPump2, labelWidth: labelWidth)
        SliderField(label: "Heating Period", labelShort: "ms", value: $heatingPeriod, labelWidth: labelWidth, min: 1000, max: 10000, step: 100)
    }

    @ViewBuilder
    private func fermentationEditableFields(labelWidth: CGFloat) -> some View {
        ActuatorPickerField(title: "Cool Actuator", selection: $coolActuator, options: optionsForCoolActuator, labelWidth: labelWidth)
        ActuatorPickerField(title: "Fan Actuator", selection: $fanActuator, options: optionsForFanActuator, labelWidth: labelWidth)
        SliderField(label: "Heating Period", labelShort: "ms", value: $heatingPeriod, labelWidth: labelWidth, min: 1000, max: 10000, step: 100)
        SliderField(label: "Cooling Period", labelShort: "ms", value: $coolingPeriod, labelWidth: labelWidth, min: 1000, max: 999999, step: 1000)
        SliderField(label: "Cooling On Time", labelShort: "ms", value: $coolingOnTime, labelWidth: labelWidth, min: 1000, max: 999999, step: 1000)
        SliderField(label: "Cooling Off Time", labelShort: "ms", value: $coolingOffTime, labelWidth: labelWidth, min: 1000, max: 999999, step: 1000)
        SliderField(label: "Fan PWM", labelShort: "%", value: $fanPwm, labelWidth: labelWidth, min: 1, max: 100, step: 1)
    }

    // MARK: - Read-only content (archived configurations)

    private var readOnlyContent: some View {
        Form {
            Section(header: Text("Basic Information")) {
                PropertyRow(label: "Name", value: configuration.name)
                PropertyRow(label: "Archived", value: configuration.archived ? "Yes" : "No")
                PropertyRow(label: "Device", value: configuration.device.name ?? "Unknown")
            }
            if configurationType == .Brew {
                Section(header: Text("Settings")) {
                    PropertyRow(label: "Temperatur", value: configuration.temperature.description)
                    PropertyRow(label: "Temp Sensor", value: "\(configuration.tempSensor.pinNr .description)/\(configuration.tempSensor.hwAddress)")
                    PropertyRow(label: "Heat Actuator", value: "\(configuration.heatActuator.pinNr .description)/\(configuration.heatActuator.hwAddress)")
                    PropertyRow(label: "Heating Period", value: configuration.heatingPeriod.description)
                }
            } else {
                Section(header: Text("Settings")) {
                    PropertyRow(label: "Temperatur", value: configuration.temperature.description)
                    PropertyRow(label: "Temp Sensor", value: "\(configuration.tempSensor.pinNr .description)/\(configuration.tempSensor.hwAddress)")
                    PropertyRow(label: "Heat Actuator", value: "\(configuration.heatActuator.pinNr .description)/\(configuration.heatActuator.hwAddress)")
                    PropertyRow(label: "Cool Actuator", value: "\(configuration.coolActuator?.pinNr .description ?? "")/\(configuration.coolActuator?.hwAddress ?? "")")
                    PropertyRow(label: "Heating Period", value: configuration.heatingPeriod.description)
                    PropertyRow(label: "Cooling Period", value: configuration.coolingPeriod?.description ?? "0")
                    PropertyRow(label: "Cooling On Time", value: configuration.coolingOnTime?.description ?? "0")
                    PropertyRow(label: "Cooling Off Time", value: configuration.coolingOffTime?.description ?? "0")
                }
            }
            Section(header: Text("Timestamps")) {
                PropertyRow(label: "Created At", value: isoFormatter.string(from: configuration.createdAt))
                PropertyRow(label: "Updated At", value: isoFormatter.string(from: configuration.updatedAt))
            }
        }
    }

    // MARK: - State population

    /// After fresh device data loads, replace state selections with matching objects
    /// from the device list so Picker tags match the selection by Hashable equality.
    private func reconcileSelectionsWithDeviceData() {
        let allConnected = currentDevice?.connectedDevices ?? []
        if let id = heatActuator?.id, let fresh = allConnected.first(where: { $0.id == id }) {
            heatActuator = fresh
        }
        if let id = tempSensor?.id, let fresh = allConnected.first(where: { $0.id == id }) {
            tempSensor = fresh
        }
        if let id = pump1Actuator?.id, let fresh = allConnected.first(where: { $0.id == id }) {
            pump1Actuator = fresh
        }
        if let id = pump2Actuator?.id, let fresh = allConnected.first(where: { $0.id == id }) {
            pump2Actuator = fresh
        }
        if let id = coolActuator?.id, let fresh = allConnected.first(where: { $0.id == id }) {
            coolActuator = fresh
        }
        if let id = fanActuator?.id, let fresh = allConnected.first(where: { $0.id == id }) {
            fanActuator = fresh
        }
    }

    private func populateState(from config: BeerConfiguration) {
        name = config.name
        temperature = config.temperature
        heatActuator = config.heatActuator
        tempSensor = config.tempSensor
        heatingPeriod = config.heatingPeriod
        pump1Actuator = config.pump1Actuator
        pump2Actuator = config.pump2Actuator
        heaterPwm = config.heaterPwm ?? 0
        coolActuator = config.coolActuator
        fanActuator = config.fanActuator
        fanPwm = config.fanPwm ?? 0
        coolingPeriod = config.coolingPeriod ?? 0
        coolingOnTime = config.coolingOnTime ?? 0
        coolingOffTime = config.coolingOffTime ?? 0
    }
}

#Preview("Editable Brew") {
    NavigationStack {
        ConfigurationSettingsView(configuration: beerConfigurations[0])
            .environmentObject(DevicesViewModel())
            .environmentObject(ConfigurationsViewModel(withMockData: true))
    }
}

#Preview("Archived Read-Only") {
    NavigationStack {
        ConfigurationSettingsView(configuration: beerConfigurations[1])
            .environmentObject(DevicesViewModel())
            .environmentObject(ConfigurationsViewModel(withMockData: true))
    }
}
