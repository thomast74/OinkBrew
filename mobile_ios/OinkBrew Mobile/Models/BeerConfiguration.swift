import Foundation
import SwiftUI

enum BeerConfgurationType: Int {
    case Brew = 1
    case Fermentation = 2
}

protocol ConfigurationBodyConvertible {
    var type: Int { get }
    var deviceId: String { get }
    var name: String { get }
    var temperature: Double { get }
    var heatActuator: ConnectedDevice { get }
    var tempSensor: ConnectedDevice { get }
    var heatingPeriod: Int { get }
    var p: Int { get }
    var i: Int { get }
    var d: Int { get }
    var archived: Bool { get }
    var pump1Actuator: ConnectedDevice? { get }
    var pump2Actuator: ConnectedDevice? { get }
    var heaterPwm: Int? { get }
    var pump1Pwm: Int? { get }
    var pump2Pwm: Int? { get }
    var coolActuator: ConnectedDevice? { get }
    var fanActuator: ConnectedDevice? { get }
    var fanPwm: Int? { get }
    var coolingPeriod: Int? { get }
    var coolingOnTime: Int? { get }
    var coolingOffTime: Int? { get }
}

struct BeerConfiguration: Hashable, Codable, Identifiable {
    var type: Int
    var id: Int
    var createdAt: Date
    var updatedAt: Date
    var name: String
    var archived: Bool
    
    var device: Device
    
    var temperature: Double
    var heatActuator: ConnectedDevice
    var tempSensor: ConnectedDevice
    
    // Brew Configuration
    var pump1Actuator: ConnectedDevice?
    var pump2Actuator: ConnectedDevice?
    var heaterPwm: Int?
    var pump1Pwm: Int?
    var pump2Pwm: Int?
    
    // Fridge Configuration
    var coolActuator: ConnectedDevice?
    var fanActuator: ConnectedDevice?
    var fanPwm: Int?
    var coolingPeriod: Int?
    var coolingOnTime: Int?
    var coolingOffTime: Int?
    
    // General Configuration
    var heatingPeriod: Int
    var p: Int
    var i: Int
    var d: Int
    
    var image: Image {
        let imageName = type == 1 ? "brewing" : "fermenting"
        return Image(imageName)
    }
}

extension BeerConfiguration {
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(Int.self, forKey: .type)
        id = try container.decode(Int.self, forKey: .id)
        createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt) ?? Date()
        updatedAt = try container.decodeIfPresent(Date.self, forKey: .updatedAt) ?? Date()
        name = try container.decode(String.self, forKey: .name)
        archived = try container.decode(Bool.self, forKey: .archived)
        device = try container.decode(Device.self, forKey: .device)
        temperature = try container.decode(Double.self, forKey: .temperature)
        heatActuator = try container.decode(ConnectedDevice.self, forKey: .heatActuator)
        tempSensor = try container.decode(ConnectedDevice.self, forKey: .tempSensor)
        pump1Actuator = try container.decodeIfPresent(ConnectedDevice.self, forKey: .pump1Actuator)
        pump2Actuator = try container.decodeIfPresent(ConnectedDevice.self, forKey: .pump2Actuator)
        heaterPwm = try container.decodeIfPresent(Int.self, forKey: .heaterPwm)
        pump1Pwm = try container.decodeIfPresent(Int.self, forKey: .pump1Pwm)
        pump2Pwm = try container.decodeIfPresent(Int.self, forKey: .pump2Pwm)
        coolActuator = try container.decodeIfPresent(ConnectedDevice.self, forKey: .coolActuator)
        fanActuator = try container.decodeIfPresent(ConnectedDevice.self, forKey: .fanActuator)
        fanPwm = try container.decodeIfPresent(Int.self, forKey: .fanPwm)
        coolingPeriod = try container.decodeIfPresent(Int.self, forKey: .coolingPeriod)
        coolingOnTime = try container.decodeIfPresent(Int.self, forKey: .coolingOnTime)
        coolingOffTime = try container.decodeIfPresent(Int.self, forKey: .coolingOffTime)
        heatingPeriod = try container.decode(Int.self, forKey: .heatingPeriod)
        p = try container.decode(Int.self, forKey: .p)
        i = try container.decode(Int.self, forKey: .i)
        d = try container.decode(Int.self, forKey: .d)
    }
}

extension BeerConfiguration: ConfigurationBodyConvertible {
    var deviceId: String { device.id }
}

// MARK: - Create configuration payload (POST /configurations)

/// Payload for creating a new configuration. Matches backend ConfigurationDto shape (no id; archived is set server-side to false).
struct CreateConfigurationPayload {
    var deviceId: String
    var name: String
    var type: Int
    var temperature: Double
    var heatActuator: ConnectedDevice
    var tempSensor: ConnectedDevice
    var heatingPeriod: Int
    var p: Int
    var i: Int
    var d: Int

    // Brew (type 1)
    var pump1Actuator: ConnectedDevice?
    var pump2Actuator: ConnectedDevice?
    var heaterPwm: Int?

    // Fridge / Fermentation (type 2)
    var coolActuator: ConnectedDevice?
    var fanActuator: ConnectedDevice?
    var fanPwm: Int?
    var coolingPeriod: Int?
    var coolingOnTime: Int?
    var coolingOffTime: Int?
}

extension CreateConfigurationPayload: ConfigurationBodyConvertible {
    var archived: Bool { false }
    var pump1Pwm: Int? { nil }
    var pump2Pwm: Int? { nil }
}
