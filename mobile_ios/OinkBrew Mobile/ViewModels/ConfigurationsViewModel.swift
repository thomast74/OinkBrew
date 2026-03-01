import Foundation

@MainActor
class ConfigurationsViewModel: ObservableObject {
       
    @Published var configurations: [BeerConfiguration] = []
    @Published var errorMessage = ""
    @Published var hasError = false
    /// When false, show active only (default). When true, show archived only.
    @Published var showArchivedOnly: Bool = false
    
    private var withMockData: Bool = false
    
    init(withMockData: Bool = false) {
        self.withMockData = withMockData
    }
    
    func loadConfigurations() async {
        if withMockData {
            loadMockData()
            return
        }

        guard let data = try? await APIService.shared.getConfigurations(archived: showArchivedOnly) else {
            self.configurations = []
            self.hasError = true
            self.errorMessage = "Server Error"
            return
        }
        
        self.configurations = data
    }
    
    private func loadMockData() {
        self.configurations = beerConfigurations.filter { $0.archived == showArchivedOnly }
    }
    
    /// Toggles between active and archived, then refetches configurations.
    func toggleArchiveFilter() async {
        showArchivedOnly.toggle()
        await loadConfigurations()
    }
}
