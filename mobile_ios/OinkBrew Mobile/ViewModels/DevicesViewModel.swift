import Foundation

@MainActor
class DevicesViewModel: ObservableObject {
       
    @Published var devices: [Device] = []
    @Published var errorMessage = ""
    @Published var hasError = false
    
    func loadDevices() async {
        guard let data = try?  await  APIService().getDevices() else {
            self.devices = []
            self.hasError = true
            self.errorMessage  = "Server Error"
            return
        }
        
        self.devices = data
    }
}

