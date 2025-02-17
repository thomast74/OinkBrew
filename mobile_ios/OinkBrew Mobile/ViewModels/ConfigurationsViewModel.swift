import Foundation

@MainActor
class ConfigurationsViewModel: ObservableObject {
       
    @Published var configurations: [BeerConfiguration] = []
    @Published var errorMessage = ""
    @Published var hasError = false
    
    private var withMockData: Bool = false
    
    init(withMockData: Bool = false) {
        self.withMockData = withMockData
    }
    
    func loadConfigurations() async {
        if (withMockData) {
            loadMockData()
            return
        }

        guard let data = try?  await  APIService().getConfigurations() else {
            self.configurations = []
            self.hasError = true
            self.errorMessage  = "Server Error"
            return
        }
        
        self.configurations = data
    }
    
    private func loadMockData() {
        self.configurations = beerConfigurations
    }
}
