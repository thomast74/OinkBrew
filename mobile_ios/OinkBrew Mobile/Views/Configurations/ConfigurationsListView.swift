import SwiftUI

struct ConfigurationsListView: View {
    @EnvironmentObject var cm: ConfigurationsViewModel
    @EnvironmentObject var devicesViewModel: DevicesViewModel
    @Binding var presentSideMenu: Bool

    @State private var selectedConfiguration: BeerConfiguration?
    @State private var searchText = ""
    @State private var showAddConfiguration = false

    // Navigation guard state
    private enum PendingAction {
        case selectConfiguration(BeerConfiguration)
        case toggleArchive
    }
    @State private var pendingAction: PendingAction?
    @State private var showNavigationGuard = false
    @State private var showSaveError = false
    @State private var saveErrorMessage = ""

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
                        showAddConfiguration = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .resizable()
                            .frame(width: 28, height: 28)
                    }
                    Button {
                        if cm.detailHasUnsavedChanges {
                            pendingAction = .toggleArchive
                            showNavigationGuard = true
                        } else {
                            Task {
                                await cm.toggleArchiveFilter()
                            }
                        }
                    } label: {
                        Image(cm.showArchivedOnly ? "archive" : "archiveCrossed")
                            .resizable()
                            .frame(width: 28, height: 28)
                    }
                }
                .sheet(isPresented: $showAddConfiguration) {
                    AddConfigurationView(
                        onDismiss: { showAddConfiguration = false },
                        onCreated: {
                            Task { await cm.loadConfigurations() }
                            showAddConfiguration = false
                        }
                    )
                    .environmentObject(devicesViewModel)
                    .environmentObject(cm)
                    .interactiveDismissDisabled()
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
            .onChange(of: selectedConfiguration) { oldValue, newValue in
                // Skip if this change is caused by the guard reverting or completing navigation
                if pendingAction != nil { return }

                if cm.detailHasUnsavedChanges, let old = oldValue, let new = newValue, new != old {
                    pendingAction = .selectConfiguration(new)
                    selectedConfiguration = old
                    showNavigationGuard = true
                }
            }
            .alert("Unsaved Changes", isPresented: $showNavigationGuard) {
                Button("Save") {
                    Task {
                        if let config = cm.pendingSaveConfiguration {
                            await cm.updateConfiguration(config)
                            if !cm.hasError {
                                cm.detailHasUnsavedChanges = false
                                cm.pendingSaveConfiguration = nil
                                completePendingAction()
                            } else {
                                saveErrorMessage = cm.errorMessage
                                showSaveError = true
                                pendingAction = nil
                            }
                        }
                    }
                }
                Button("Discard", role: .destructive) {
                    cm.detailHasUnsavedChanges = false
                    cm.pendingSaveConfiguration = nil
                    completePendingAction()
                }
                Button("Cancel", role: .cancel) {
                    pendingAction = nil
                }
            } message: {
                Text("You have unsaved changes. What would you like to do?")
            }
            .alert("Save Error", isPresented: $showSaveError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(saveErrorMessage)
            }
        }
    }

    private func completePendingAction() {
        let action = pendingAction
        pendingAction = nil
        switch action {
        case .selectConfiguration(let config):
            selectedConfiguration = config
        case .toggleArchive:
            Task { await cm.toggleArchiveFilter() }
        case .none:
            break
        }
    }
}

#Preview {
    @Previewable @State var mockPresentSideMenu = false

    let mockCM = ConfigurationsViewModel(withMockData: true)
    let mockDM = DevicesViewModel()
    
    ConfigurationsListView(presentSideMenu: $mockPresentSideMenu)
        .environmentObject(mockCM)
        .environmentObject(mockDM)
}
