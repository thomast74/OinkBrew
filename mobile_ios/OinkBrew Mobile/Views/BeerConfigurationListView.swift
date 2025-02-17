import SwiftUI

struct BeerConfigurationListView: View {
    @EnvironmentObject var vm: ConfigurationsViewModel

    var addConfiguration: () -> Void
    
    var body: some View {
        List(vm.configurations, id: \.id) { configuration in
            NavigationLink {
                if configuration.type == BeerConfgurationType.Brew.rawValue {
                    BrewDetailView(configuration: configuration)
                } else {
                    FermentationDetailView(configuration: configuration)
                }
            } label: {
                BeerConfigurationRowView(configuration: configuration)
            }
        }
        	
//            ToolbarItem(placement: ToolbarItemPlacement.navigation) {
//                Text("Configurations")
//                .id(UUID())
//            }
//            ToolbarItem(placement: ToolbarItemPlacement.confirmationAction) {
//                Button {
//                    addConfiguration()
//                } label: {
//                    Image(systemName: "plus")
//                }
//                .foregroundColor(.blue)
//                .id(UUID())
//            }
        }
    }


#Preview {
    BeerConfigurationListView(addConfiguration: {})
        .environmentObject(ConfigurationsViewModel())
}
