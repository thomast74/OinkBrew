import SwiftUI

struct DeviceDetailView: View {

    @State private var deviceName: String
    @State private var showSaveButton: Bool = false
    
    private let device: Device
    private let isoFormatter: ISO8601DateFormatter
        
    init(device: Device) {
        self.device = device
        self.deviceName = device.name ?? ""
        
        isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withFullDate, .withDashSeparatorInDate, .withTime, .withSpaceBetweenDateAndTime, .withColonSeparatorInTime]
    }
    
    var body: some View {
        Form {
            Section(header: Text("Basic Information")) {
                InputPropertyRow(label: "Name", value: $deviceName) { newValue in
                    print("Parent view: User Name changed to: \(newValue)")
                    showSaveButton = true
                }
                PropertyRow(label: "Serial Number", value: device.serial_number)
                PropertyRow(label: "Shield Version", value: device.shieldVersion?.description ?? "")
                PropertyRow(label: "Firmware", value: device.firmwareVersion?.description ?? "")
                PropertyRow(label: "System Firmware", value: device.system_firmware_version)
            }

            Section(header: Text("Status & Notes")) {
                PropertyRow(label: "Online", value: device.online ? "Yes" : "No")
                PropertyRow(label: "Connected", value: device.connected ? "Yes" : "No")
                PropertyRow(label: "Status", value: device.status)
                PropertyRow(label: "Notes", value: (device.notes?.isEmpty ?? true) ? "No notes" : device.notes!)
            }

            Section(header: Text("Timestamps")) {
                PropertyRow(label: "Created At", value: isoFormatter.string(from: device.createdAt))
                PropertyRow(label: "Updated At", value: isoFormatter.string(from: device.updatedAt))
                PropertyRow(label: "Last Heard", value: isoFormatter.string(from: device.last_heard))
                PropertyRow(label: "Last Handshake", value: isoFormatter.string(from: device.last_handshake_at))

            }
        }
        .navigationTitle(device.name ?? device.id)
        
        .toolbar {
            if (showSaveButton) {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        // ✨ Perform your save action here ✨
                    }
                }
                
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        // ✨ Perform your save action here ✨
                    }
                }
            }
        }
    }
}

#Preview {
    DeviceDetailView(device: devices[0])
}
