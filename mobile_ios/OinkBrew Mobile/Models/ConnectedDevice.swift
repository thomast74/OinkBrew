import Foundation

struct ConnectedDevice: Hashable, Codable {
    var type: Int
    var pinNr: Int
    var hwAddress: String
    var connected: Bool?
    var name: String?
    var offset: Double?
    var deviceOffset: Double?
}
