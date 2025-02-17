import SwiftUI

struct ConfigurationRowView: View {
    var configuration: BeerConfiguration
    var isSelected: Bool
    
    private let isoFormatter: ISO8601DateFormatter
    
    init(configuration: BeerConfiguration, isSelected: Bool) {
        self.configuration = configuration
        self.isSelected = isSelected
        
        isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withFullDate, .withDashSeparatorInDate]
    }

    var body: some View {
        HStack {
            Rectangle()
                .fill(isSelected ? .orange : .white.opacity(0.0))
                .frame(width: 5)
                .padding(.trailing, 12)
            Image(configuration.type == BeerConfgurationType.Brew.rawValue ? "brewing" : "fermenting")
                .resizable()
                .renderingMode(.template)
                .frame(width: 40, height: 40)
                .padding(.trailing, 8)
                .foregroundColor(isSelected ? .black : .gray)
            VStack(alignment: .leading, spacing: 4) {
                Text(configuration.name)
                    .font(.title)
                    .fontWeight(.semibold)
                    .foregroundColor(isSelected ? .black : .gray)
                Text(isoFormatter.string(from: configuration.createdAt))
                    .font(.subheadline)
                    .fontWeight(.regular)
                    .foregroundColor(isSelected ? .black : .gray)
            }
            .padding()
            Spacer()
        }
        .frame(height: 80)
    }
}

#Preview {
    Group {
        ConfigurationRowView(configuration: beerConfigurations[0], isSelected: true)
        ConfigurationRowView(configuration: beerConfigurations[1], isSelected: false)
    }
}

