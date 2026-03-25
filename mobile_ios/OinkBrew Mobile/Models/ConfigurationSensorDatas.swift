import Foundation

struct SensorData: Codable {
    var name: String
    var value: Double
}

struct ConfigurationSensorDatas: Codable {
    var publishedAt: String
    var configurationId: Int
    var sensorData: [String: [SensorData]]
}
