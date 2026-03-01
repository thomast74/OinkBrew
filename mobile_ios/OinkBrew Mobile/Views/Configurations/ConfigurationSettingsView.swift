import SwiftUI

struct ConfigurationSettingsView: View {
    
    let configuration: BeerConfiguration
    
    private let isoFormatter: ISO8601DateFormatter
        
    init(configuration: BeerConfiguration) {
        self.configuration = configuration
        
        isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withFullDate, .withDashSeparatorInDate, .withTime, .withSpaceBetweenDateAndTime, .withColonSeparatorInTime]
    }
    
    var body: some View {
        VStack {
            Form {
                Section(header: Text("Basic Information")) {
                    PropertyRow(label: "Name", value: configuration.name)
                    PropertyRow(label: "Archived", value: configuration.archived ? "Yes" : "No")
                    PropertyRow(label: "Device", value: configuration.device.name ?? "Unknown")
                }
                if configuration.type == BeerConfgurationType.Brew.rawValue {
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
    }
}

#Preview {
    ConfigurationSettingsView(configuration: beerConfigurations[1])
}
