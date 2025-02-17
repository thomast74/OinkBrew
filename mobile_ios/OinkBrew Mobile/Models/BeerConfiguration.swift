import Foundation
import SwiftUI

enum BeerConfgurationType: Int {
    case Brew = 1
    case Fermentation = 2
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
