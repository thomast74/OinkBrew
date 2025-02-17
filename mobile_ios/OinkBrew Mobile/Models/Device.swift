import Foundation

struct Device: Hashable, Codable, Identifiable {
    var _id: String
    var __v: Int
    
    var id: String
    var createdAt: Date
    var updatedAt: Date
    var name: String?
    var last_ip_address: String
    var last_heard: Date
    var last_handshake_at: Date
    var product_id: Int
    var online: Bool
    var connected: Bool
    var platform_id: Int
    var cellular: Bool
    var notes: String?
    var firmware_updates_enabled: Bool
    var firmware_updates_forced: Bool
    var status: String
    var serial_number: String
    var system_firmware_version: String
    var current_build_target: String
    var pinned_build_target: String?
    var default_build_target: String
    var functions: [String]
    var variables: [String:String]
    var shieldVersion: Int?
    var firmwareVersion: Double?
    var connectedDevices: [ConnectedDevice]
}
