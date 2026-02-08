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
}

