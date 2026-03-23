import SwiftUI

struct ConfigurationDetailView: View {
    
    @Environment(\.colorScheme) var colorScheme
    @EnvironmentObject var cm: ConfigurationsViewModel
    @State private var selectedView: Int = 0
    @State private var isUpdatingArchive = false
    
    private let configuration: BeerConfiguration
    private let isoFormatter: ISO8601DateFormatter
        
    init(configuration: BeerConfiguration) {
        self.configuration = configuration
        
        isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withFullDate, .withDashSeparatorInDate, .withTime, .withSpaceBetweenDateAndTime, .withColonSeparatorInTime]
    }
    
    var body: some View {
        VStack {
            Picker("Select View", selection: $selectedView) {
                Text("Info").tag(0)
                Text("Chart").tag(1)
            }
            .pickerStyle(.segmented)
            .padding()
            
            if selectedView == 0 {
                ConfigurationSettingsView(configuration: self.configuration)
                    .id(self.configuration.id)
                    .transition(.opacity)
            } else {
                ConfigurationChartView(configuration: self.configuration)
                    .transition(.opacity)
            }
            Spacer()
        }
        .background(colorScheme == .dark ? Color(UIColor.systemBackground) : Color(UIColor.systemGroupedBackground))
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button(configuration.archived ? "Unarchive" : "Archive") {
                    Task {
                        isUpdatingArchive = true
                        await cm.setArchived(configuration, archived: !configuration.archived)
                        isUpdatingArchive = false
                    }
                }
                .foregroundColor(.blue)
                .disabled(isUpdatingArchive)
            }
        }
    }
}

#Preview("Editable Brew") {
    ConfigurationDetailView(configuration: beerConfigurations[0])
        .environmentObject(ConfigurationsViewModel(withMockData: true))
        .environmentObject(DevicesViewModel())
}

#Preview("Archived Read-Only") {
    ConfigurationDetailView(configuration: beerConfigurations[1])
        .environmentObject(ConfigurationsViewModel(withMockData: true))
        .environmentObject(DevicesViewModel())
}

