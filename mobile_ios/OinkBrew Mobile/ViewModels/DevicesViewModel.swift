import Foundation

@MainActor
class DevicesViewModel: ObservableObject {
       
    @Published var devices: [Device] = []
    @Published var errorMessage = ""
    @Published var hasError = false
    
    func loadDevices() async {
        guard let data = try?  await  APIService.shared.getDevices() else {
            self.devices = []
            self.hasError = true
            self.errorMessage  = "Server Error"
            return
        }
        
        self.devices = data
    }

    func saveDevice(id: String, name: String, notes: String?) async throws {
        try await APIService.shared.updateDevice(id: id, name: name, notes: notes)
        updateDevice(id: id, name: name, notes: notes)
    }

    func updateDevice(id: String, name: String, notes: String?) {
        guard let index = devices.firstIndex(where: { $0.id == id }) else { return }
        var device = devices[index]
        device.name = name
        device.notes = notes
        devices[index] = device
    }

    /// Updates connected device on the backend, then updates local state so the UI reflects the change without refetch.
    func saveConnectedDevice(deviceId: String, pinNr: Int, hwAddress: String, name: String, offset: Double) async throws {
        try await APIService.shared.updateConnectedDevice(deviceId: deviceId, pinNr: pinNr, hwAddress: hwAddress, name: name, offset: offset)
        updateFontEndConnectedDevice(deviceId: deviceId, pinNr: pinNr, hwAddress: hwAddress, name: name, offset: offset)
    }

    /// Updates name and offset for a connected device in local `devices` so the UI reflects the change without refetch.
    func updateFontEndConnectedDevice(deviceId: String, pinNr: Int, hwAddress: String, name: String, offset: Double) {
        guard let deviceIndex = devices.firstIndex(where: { $0.id == deviceId }) else { return }
        guard let cdIndex = devices[deviceIndex].connectedDevices.firstIndex(where: { $0.pinNr == pinNr && $0.hwAddress == hwAddress }) else { return }
        var device = devices[deviceIndex]
        var connected = device.connectedDevices[cdIndex]
        connected.name = name
        connected.offset = offset
        device.connectedDevices[cdIndex] = connected
        devices[deviceIndex] = device
    }
}

