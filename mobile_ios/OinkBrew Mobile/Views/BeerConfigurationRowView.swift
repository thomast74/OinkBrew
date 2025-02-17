import SwiftUI

struct BeerConfigurationRowView: View {
    var configuration: BeerConfiguration
    
    var body: some View {
        HStack {
            configuration.image
                .resizable()
                .frame(width: 40, height: 40)
                .padding(.trailing, 8)
            Text(configuration.name)
            Spacer()
        }
    }
}

#Preview {
    Group {
        BeerConfigurationRowView(configuration: beerConfigurations[0])
        BeerConfigurationRowView(configuration: beerConfigurations[1])
    }
}
