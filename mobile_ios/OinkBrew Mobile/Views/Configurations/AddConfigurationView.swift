import SwiftUI

/// Modal to add a new configuration: type → device (fresh API load) → type-specific form.
/// Loads devices in .onAppear so the list is always current.
struct AddConfigurationView: View {
    @EnvironmentObject private var devicesViewModel: DevicesViewModel
    @EnvironmentObject private var configurationsViewModel: ConfigurationsViewModel

    var onDismiss: () -> Void
    var onCreated: (() -> Void)?

    // MARK: - Type & device
    @State private var configurationType: BeerConfgurationType = .Brew
    @State private var selectedDeviceId: String?

    // MARK: - Common (initial values = backend defaults per backend/README.md)
    @State private var name = ""
    @State private var temperature: Double = 1
    @State private var heatActuator: ConnectedDevice?
    @State private var tempSensor: ConnectedDevice?
    @State private var heatingPeriod: Int = 2000
    @State private var p: Int = 90
    @State private var i: Int = 0  // backend default pid.i 0.0001 applied server-side if needed
    @State private var d: Int = -45

    // Brew (defaults: temperature 1, heatingPeriod 2000, p 90, d -45, heaterPwm 0)
    @State private var pump1Actuator: ConnectedDevice?
    @State private var pump2Actuator: ConnectedDevice?
    @State private var heaterPwm: Int = 0

    // Fermentation (defaults: temperature 19, heatingPeriod 1000, coolingPeriod 600000, etc.)
    @State private var coolActuator: ConnectedDevice?
    @State private var fanActuator: ConnectedDevice?
    @State private var fanPwm: Int = 100
    @State private var coolingPeriod: Int = 600_000
    @State private var coolingOnTime: Int = 150_000
    @State private var coolingOffTime: Int = 180_000

    @State private var isSubmitting = false
    @State private var showError = false
    @State private var errorMessage = ""

    // Validation: backend DTO temperature 0–100, PWM 0–100, periods ≥ 0
    private let temperatureRange: ClosedRange<Double> = 0 ... 100
    private let pwmRange: ClosedRange<Int> = 0 ... 100
    private let periodMin = 0
    private let heatingPeriodRange: ClosedRange<Double> = 1000 ... 10000

    private var onlineDevices: [Device] {
        devicesViewModel.devices.filter { $0.online }
    }

    private var selectedDevice: Device? {
        guard let id = selectedDeviceId else { return nil }
        return devicesViewModel.devices.first { $0.id == id }
    }

    private var actuators: [ConnectedDevice] {
        guard let device = selectedDevice else { return [] }
        return device.connectedDevices.filter {
            $0.deviceType == .actuatorDigital || $0.deviceType == .actuatorPWM
        }
    }

    private var tempSensors: [ConnectedDevice] {
        guard let device = selectedDevice else { return [] }
        return device.connectedDevices.filter { $0.deviceType == .oneWireTemp }
    }

    // Actuator single-selection: each actuator can only be chosen in one picker.
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

    /// Options for each picker: available actuators plus current selection (so selection is always in the list).
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

    private var canSubmit: Bool {
        let nameOk = !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        let deviceOk = selectedDeviceId != nil
        let heatOk = heatActuator != nil
        let sensorOk = tempSensor != nil
        let requiredOk: Bool
        if configurationType == .Brew {
            requiredOk = nameOk && deviceOk && heatOk && sensorOk
        } else {
            requiredOk = nameOk && deviceOk && heatOk && sensorOk && coolActuator != nil
        }
        return requiredOk && numericRangesValid
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            GeometryReader { geometry in
                let labelWidth = geometry.size.width * 0.3
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // 1. Type selection
                        typeSection

                        // 2. Device selection (with remark)
                        deviceSection(labelWidth: labelWidth)

                        // 3. Form when device selected
                        if selectedDevice != nil {
                            formSection(labelWidth: labelWidth)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                }
                .padding(.bottom, 16)
            }
        }
        .background(Color(.white))
        .onAppear {
            Task {
                await devicesViewModel.loadDevices()
            }
        }
        .onChange(of: configurationType) { _, newType in
            resetFormForType(newType)
        }
        .onChange(of: selectedDeviceId) { _, _ in
            clearDeviceDependentSelections()
        }
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
    }

    private var header: some View {
        HStack {
            Button("Cancel") {
                onDismiss()
            }
            Spacer()
            Text("New Configuration")
                .font(.headline)
            Spacer()
            Button("Save") {
                submit()
            }
            .disabled(!canSubmit || isSubmitting)
        }
        .padding()
        .background(Color(.white))
    }

    private var typeSection: some View {
        Group {
            Text("Type")
                .font(.title2)
            Picker("Configuration type", selection: $configurationType) {
                Text("Brew").tag(BeerConfgurationType.Brew)
                Text("Fermentation").tag(BeerConfgurationType.Fermentation)
            }
            .pickerStyle(.segmented)
        }
    }

    private func deviceSection(labelWidth: CGFloat) -> some View {
        Group {
            Text("Device")
                .font(.title2)
            Text("Make sure that the device is online and all required sensors are connected.")
                .font(.caption)
                .foregroundColor(.secondary)
            HStack {
                Text("Run on")
                    .frame(width: labelWidth, alignment: .leading)
                    .font(.body)
                Spacer()
                Picker("Device", selection: $selectedDeviceId) {
                    Text("Select a device").tag(nil as String?)
                    ForEach(onlineDevices) { device in
                        Text(device.name ?? device.id)
                            .tag(device.id as String?)
                    }
                }
                .pickerStyle(.menu)
            }
        }
    }

    @ViewBuilder
    private func formSection(labelWidth: CGFloat) -> some View {
        Group {
            Text("Details")
                .font(.title2)
            
            HStack(alignment: .center) {
                Text("Name")
                    .frame(width: labelWidth, alignment: .leading)
                    .font(.body)
                TextField("Name", text: $name)
                    .textFieldStyle(.plain)
                    .autocapitalization(.words)
                    .multilineTextAlignment(.trailing)
                    .padding(.trailing, 16)
            }
                     
            actuatorPicker(title: "Heat Actuator", selection: $heatActuator, options: optionsForHeatActuator, labelWidth: labelWidth)
            tempSensorPicker(labelWidth: labelWidth)
            sliderField(label: "Set Temperature", labelShort: "C", value: $temperature, labelWidth: labelWidth, min: 0, max: 100, step: 0.5)
            
            if configurationType == .Brew {
                brewFields(labelWidth: labelWidth)
            } else {
                fermentationFields(labelWidth: labelWidth)
            }

            // PID (optional in UI; we send defaults)
            Section {
                HStack {
                    Text("P (Proportional)")
                        .frame(width: labelWidth, alignment: .leading)
                    TextField("P", value: $p, format: .number)
                        .keyboardType(.numbersAndPunctuation)
                        .multilineTextAlignment(.trailing)
                        .textFieldStyle(.plain)
                        .padding(.trailing, 16)
                }
                HStack {
                    Text("I (Integral)")
                        .frame(width: labelWidth, alignment: .leading)
                    TextField("I", value: $i, format: .number)
                        .keyboardType(.numbersAndPunctuation)
                        .multilineTextAlignment(.trailing)
                        .textFieldStyle(.plain)
                        .padding(.trailing, 16)
                }
                HStack {
                    Text("D (Derivative)")
                        .frame(width: labelWidth, alignment: .leading)
                    TextField("D", value: $d, format: .number)
                        .keyboardType(.numbersAndPunctuation)
                        .multilineTextAlignment(.trailing)
                        .textFieldStyle(.plain)
                        .padding(.trailing, 16)
                }
            } header: {
                Text("Advanced")
                    .font(.title2)
            }
        }
    }

    @ViewBuilder
    private func brewFields(labelWidth: CGFloat) -> some View {
        sliderField(label: "Heater PWM", labelShort: "%", value: $heaterPwm, labelWidth: labelWidth, min: 1, max: 100, step: 1)
        actuatorPicker(title: "Pump 1 Actuator", selection: $pump1Actuator, options: optionsForPump1, labelWidth: labelWidth)
        actuatorPicker(title: "Pump 2 Actuator", selection: $pump2Actuator, options: optionsForPump2, labelWidth: labelWidth)
        sliderField(label: "Heating Period", labelShort: "ms", value: $heatingPeriod, labelWidth: labelWidth, min: 1000, max: 10000, step: 100)
    }

    @ViewBuilder
    private func fermentationFields(labelWidth: CGFloat) -> some View {
        actuatorPicker(title: "Cool Actuator", selection: $coolActuator, options: optionsForCoolActuator, labelWidth: labelWidth)
        actuatorPicker(title: "Fan Actuator", selection: $fanActuator, options: optionsForFanActuator, labelWidth: labelWidth)
        sliderField(label: "Heating Period", labelShort: "ms", value: $heatingPeriod, labelWidth: labelWidth, min: 1000, max: 10000, step: 100)
        sliderField(label: "Cooling Period", labelShort: "ms", value: $coolingPeriod, labelWidth: labelWidth, min: 1000, max: 999999, step: 1000)
        sliderField(label: "Cooling On Time", labelShort: "ms", value: $coolingOnTime, labelWidth: labelWidth, min: 1000, max: 999999, step: 1000)
        sliderField(label: "Cooling Off Time", labelShort: "ms", value: $coolingOffTime, labelWidth: labelWidth, min: 1000, max: 999999, step: 1000)
        sliderField(label: "Fan PWM", labelShort: "%", value: $fanPwm, labelWidth: labelWidth, min: 1, max: 100, step: 1)
    }
    
    private func tempSensorPicker(labelWidth: CGFloat) -> some View {
        HStack {
            Text("Temp Sensor")
                .frame(width: labelWidth, alignment: .leading)
            Spacer()
            Picker("Temp Sensor", selection: $tempSensor) {
                Text("Temp Sensor").tag(nil as ConnectedDevice?)
                ForEach(tempSensors, id: \.id) { sensor in
                    Text(sensor.name ?? sensor.hwAddress)
                        .tag(sensor as ConnectedDevice?)
                }
            }
            .pickerStyle(.menu)
        }
    }

    private func sliderField(label: String, labelShort: String, value: Binding<Int>, labelWidth: CGFloat, min: Int, max: Int, step: Int) -> some View {
        sliderFieldImpl(label: label, labelShort: labelShort, value: Binding(
            get: { Double(value.wrappedValue) },
            set: { value.wrappedValue = Int($0) }
        ), labelWidth: labelWidth, min: Double(min), max: Double(max), step: Double(step)) {
            Text("\(value.wrappedValue) \(labelShort)")
        }
    }

    private func sliderField(label: String, labelShort: String, value: Binding<Double>, labelWidth: CGFloat, min: Double, max: Double, step: Double) -> some View {
        sliderFieldImpl(label: label, labelShort: labelShort, value: value, labelWidth: labelWidth, min: min, max: max, step: step) {
            Text(String(format: "%.1f %@", value.wrappedValue, labelShort))
        }
    }

    private func sliderFieldImpl<Label: View>(
        label: String,
        labelShort: String,
        value: Binding<Double>,
        labelWidth: CGFloat,
        min: Double,
        max: Double,
        step: Double,
        @ViewBuilder valueLabel: () -> Label
    ) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .frame(width: labelWidth, alignment: .leading)
                    .font(.body)
                Spacer()
                Slider(
                    value: value,
                    in: min ... max,
                    step: step
                )
                .frame(width: 250, alignment: .trailing)
                valueLabel()
                    .font(.body)
                    .foregroundColor(.secondary)
                    .frame(minWidth: 96, alignment: .trailing)
                    .padding(.trailing, 16)
            }
        }
    }

    private func actuatorPicker(
        title: String,
        selection: Binding<ConnectedDevice?>,
        options: [ConnectedDevice],
        labelWidth: CGFloat
    ) -> some View {
        HStack {
            Text(title)
                .frame(width: labelWidth, alignment: .leading)
                .font(.body)
            Spacer()
            Picker(title, selection: selection) {
                Text("Select").tag(nil as ConnectedDevice?)
                ForEach(options, id: \.id) { device in
                    Text(device.name ?? "Pin \(device.pinNr)")
                        .tag(device as ConnectedDevice?)
                }
            }
            .pickerStyle(.menu)
        }
    }

    private func resetFormForType(_ type: BeerConfgurationType) {
        if type == .Fermentation {
            temperature = 19
            heatingPeriod = 1000
            coolingPeriod = 600_000
            coolingOnTime = 150_000
            coolingOffTime = 180_000
            fanPwm = 100
            p = 18
            d = -8
            pump1Actuator = nil
            pump2Actuator = nil
            heaterPwm = 0
        } else {
            temperature = 1
            heatingPeriod = 2000
            p = 90
            d = -45
            coolActuator = nil
            fanActuator = nil
        }
    }

    private func clearDeviceDependentSelections() {
        heatActuator = nil
        tempSensor = nil
        pump1Actuator = nil
        pump2Actuator = nil
        coolActuator = nil
        fanActuator = nil
    }

    private func submit() {
        guard let deviceId = selectedDeviceId,
              let heat = heatActuator,
              let sensor = tempSensor else { return }
        if configurationType == .Fermentation && coolActuator == nil { return }

        isSubmitting = true
        let payload = buildPayload(deviceId: deviceId, heatActuator: heat, tempSensor: sensor)
        Task {
            await configurationsViewModel.createConfiguration(payload)
            await MainActor.run {
                isSubmitting = false
                if configurationsViewModel.hasError {
                    errorMessage = configurationsViewModel.errorMessage
                    showError = true
                } else {
                    onCreated?()
                    onDismiss()
                }
            }
        }
    }

    private func buildPayload(deviceId: String, heatActuator: ConnectedDevice, tempSensor: ConnectedDevice) -> CreateConfigurationPayload {
        let typeInt = configurationType == .Brew ? 1 : 2
        var payload = CreateConfigurationPayload(
            deviceId: deviceId,
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            type: typeInt,
            temperature: temperature,
            heatActuator: heatActuator,
            tempSensor: tempSensor,
            heatingPeriod: heatingPeriod,
            p: p,
            i: i,
            d: d,
            pump1Actuator: nil,
            pump2Actuator: nil,
            heaterPwm: nil,
            coolActuator: nil,
            fanActuator: nil,
            fanPwm: nil,
            coolingPeriod: nil,
            coolingOnTime: nil,
            coolingOffTime: nil
        )
        if configurationType == .Brew {
            payload.pump1Actuator = pump1Actuator
            payload.pump2Actuator = pump2Actuator
            payload.heaterPwm = heaterPwm
        } else {
            payload.coolActuator = coolActuator
            payload.fanActuator = fanActuator
            payload.fanPwm = fanPwm
            payload.coolingPeriod = coolingPeriod
            payload.coolingOnTime = coolingOnTime
            payload.coolingOffTime = coolingOffTime
        }
        return payload
    }
}

#Preview {
    AddConfigurationView(
        onDismiss: {},
        onCreated: nil
    )
    .environmentObject(DevicesViewModel())
    .environmentObject(ConfigurationsViewModel(withMockData: true))
}
