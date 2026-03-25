import Foundation

struct SensorDataPoint: Identifiable {
    var id: String { "\(name)-\(date.timeIntervalSince1970)" }
    var date: Date
    var name: String
    var value: Double
}
