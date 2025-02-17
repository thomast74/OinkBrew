import SwiftUI

struct ConfigurationsListView: View {
    @EnvironmentObject var cm: ConfigurationsViewModel
    @Binding var presentSideMenu: Bool

    @State private var selectedConfiguration: BeerConfiguration?

    var body: some View {
        VStack{
            ZStack {
                HStack{
                    Button{
                        presentSideMenu.toggle()
                    } label: {
                        Image("menu")
                            .resizable()
                            .frame(width: 32, height: 32)
                    }
                    Spacer()
                }
                .padding(.horizontal)
                
                Text("Configurations")
                    .font(.headline)
            }
            NavigationSplitView {
                List(cm.configurations, selection: $selectedConfiguration) { configuration in
                    NavigationLink(value: configuration) {
                        ConfigurationRowView(configuration: configuration, isSelected: configuration.id == selectedConfiguration?.id)
                    }
                    .background(
                        LinearGradient(colors: [configuration.id == selectedConfiguration?.id ? .orange.opacity(0.5) : .white.opacity(0.0), .white.opacity(0.0)], startPoint: .leading, endPoint: .trailing)
                    )
                    .listRowSeparator(.hidden)
                }
                .listStyle(.plain)
                .tint(.white.opacity(0.0))
                .overlay {
                    if cm.configurations.count == 0 {
                        ContentUnavailableView {
                            Label("No configurations found", systemImage: "doc.richtext.fill")
                        } description: {
                            Text("Create a new configruation to start brewing")
                        }
                    }
                }
 
            } detail: {
                if selectedConfiguration != nil {
                    ConfigurationDetailView(configuration: selectedConfiguration!)
                } else {
                    Text("Please select a configuration from list")
                }
            }
            .onAppear {
                Task {
                    await cm.loadConfigurations()
                    if selectedConfiguration == nil && cm.configurations.count > 0 {
                        selectedConfiguration = cm.configurations.first
                    }
                }
            }
        }
    }
}

#Preview {
    @Previewable @State var mockPresentSideMenu = false

    let mockCM = ConfigurationsViewModel(withMockData: true)
    
    ConfigurationsListView(presentSideMenu: $mockPresentSideMenu)
        .environmentObject(mockCM)
}

