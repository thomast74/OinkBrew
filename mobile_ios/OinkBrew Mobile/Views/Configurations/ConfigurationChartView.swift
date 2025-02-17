import SwiftUI

struct ConfigurationChartView: View {
    
    let configuration: BeerConfiguration
    
    private let isoFormatter: ISO8601DateFormatter
        
    init(configuration: BeerConfiguration) {
        self.configuration = configuration
        
        isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withFullDate, .withDashSeparatorInDate, .withTime, .withSpaceBetweenDateAndTime, .withColonSeparatorInTime]
    }
    
    var body: some View {
        VStack {
            Text("Chart View")
            Spacer()
        }
    }
}

#Preview {
    ConfigurationChartView(configuration: beerConfigurations[1])
}
