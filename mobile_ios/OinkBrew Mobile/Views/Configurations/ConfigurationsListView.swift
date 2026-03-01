import SwiftUI

struct ConfigurationsListView: View {
    @EnvironmentObject var cm: ConfigurationsViewModel
    @Binding var presentSideMenu: Bool

    @State private var selectedConfiguration: BeerConfiguration?
    @State private var searchText = ""

    private var sortedConfigurations: [BeerConfiguration] {
        cm.configurations.sorted { $0.updatedAt > $1.updatedAt }
    }

    private var filteredConfigurations: [BeerConfiguration] {
        let trimmed = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            return sortedConfigurations
        }
        return sortedConfigurations.filter { $0.name.localizedCaseInsensitiveContains(trimmed) }
    }

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
                List(filteredConfigurations, selection: $selectedConfiguration) { configuration in
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
                .searchable(text: $searchText, prompt: "Search by name")
                .overlay {
                    if filteredConfigurations.isEmpty {
                        if sortedConfigurations.isEmpty {
                            ContentUnavailableView {
                                Label("No configurations found", systemImage: "doc.richtext.fill")
                            } description: {
                                Text("Create a new configuration to start brewing")
                            }
                        } else {
                            ContentUnavailableView.search(text: searchText)
                        }
                    }
                }.toolbar {
                    Button {
                        Task {
                            await cm.toggleArchiveFilter()
                        }
                    } label: {
                        Image(cm.showArchivedOnly ? "archive" : "archiveCrossed")
                            .resizable()
                            .frame(width: 28, height: 28)
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
                    if selectedConfiguration == nil && !sortedConfigurations.isEmpty {
                        selectedConfiguration = sortedConfigurations.first
                    }
                }
            }
            .onChange(of: cm.configurations) { _, newConfigurations in
                if let sel = selectedConfiguration,
                   !newConfigurations.contains(where: { $0.id == sel.id }) {
                    selectedConfiguration = newConfigurations.sorted { $0.updatedAt > $1.updatedAt }.first
                }
                if selectedConfiguration == nil, let first = newConfigurations.sorted(by: { $0.updatedAt > $1.updatedAt }).first {
                    selectedConfiguration = first
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
