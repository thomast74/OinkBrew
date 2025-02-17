import SwiftUI

struct ConfigurationDetailView: View {
    
    @Environment(\.colorScheme) var colorScheme
    @State private var selectedView: Int = 0
    
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
                    .transition(.opacity)
            } else {
                ConfigurationChartView(configuration: self.configuration)
                    .transition(.opacity)
            }
            Spacer()
        }
        .navigationTitle(configuration.name)
        .background(colorScheme == .dark ? Color(UIColor.systemBackground) : Color(UIColor.systemGroupedBackground))
    }
}

#Preview {
    ConfigurationDetailView(configuration: beerConfigurations[1])
}

