import Foundation

struct ConnectedDevice: Hashable, Codable, Identifiable {
    var type: Int
    var pinNr: Int
    var hwAddress: String
    var connected: Bool?
    var name: String?   
    var offset: Double?
    var deviceOffset: Double?

    /// Stable identity for use in `ForEach`; combines hwAddress and pinNr.
    var id: String { "\(hwAddress)-\(pinNr)" }

    /// Type for display and icon.
    var deviceType: ConnectedDeviceType { ConnectedDeviceType(typeCode: type) }
}

/// Maps backend connected device type (Int) to display name and SF Symbol for the UI.
/// Raw values align with backend: NONE=0, ACTUATOR_DIGITAL=1, ACTUATOR_PWM=2, ONEWIRE_TEMP=3.
enum ConnectedDeviceType: Int, CaseIterable {
    case none = 0
    case actuatorDigital = 1
    case actuatorPWM = 2
    case oneWireTemp = 3

    var displayName: String {
        switch self {
        case .none: return "Unknown"
        case .actuatorDigital: return "Digital Actuator"
        case .actuatorPWM: return "PWM Actuator"
        case .oneWireTemp: return "Temperature Sensor"
        }
    }

    var sfSymbolName: String {
        switch self {
        case .none: return "questionmark.circle"
        case .actuatorDigital: return "switch.2"
        case .actuatorPWM: return "waveform"
        case .oneWireTemp: return "thermometer.medium"
        }
    }

    /// Initialize from backend type code; unknown values map to `.none`.
    init(typeCode: Int) {
        self = ConnectedDeviceType(rawValue: typeCode) ?? .none
    }
}
