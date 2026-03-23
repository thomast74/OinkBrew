import SwiftUI

struct HomeScreen: View {
    @EnvironmentObject var cm: ConfigurationsViewModel
    @State var presentSideMenu = false
    @State var selectedSideMenuTab = 0

    // Navigation guard for tab changes
    @State private var pendingTabIndex: Int?
    @State private var showNavigationGuard = false
    @State private var showSaveError = false
    @State private var saveErrorMessage = ""

    var body: some View {
        ZStack {
            TabView(selection: $selectedSideMenuTab) {
                ConfigurationsListView(presentSideMenu: $presentSideMenu)
                    .toolbar(.hidden, for: .tabBar)
                    .tag(0)
                DevicesListView(presentSideMenu: $presentSideMenu)
                    .toolbar(.hidden, for: .tabBar)
                    .tag(1)
                SettingsView(presentSideMenu: $presentSideMenu)
                    .toolbar(.hidden, for: .tabBar)
                    .tag(2)
            }

            SideMenuScreen(
                isShowing: $presentSideMenu,
                content: AnyView(SideMenuView(selectedSideMenuTab: $selectedSideMenuTab,
                                              presentSideMenu: $presentSideMenu)))
        }
        .onChange(of: selectedSideMenuTab) { oldValue, newValue in
            if pendingTabIndex != nil { return }
            if oldValue == 0 && newValue != 0 && cm.detailHasUnsavedChanges {
                pendingTabIndex = newValue
                selectedSideMenuTab = oldValue
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
                            let pending = pendingTabIndex
                            pendingTabIndex = nil
                            if let pending { selectedSideMenuTab = pending }
                        } else {
                            saveErrorMessage = cm.errorMessage
                            showSaveError = true
                            pendingTabIndex = nil
                        }
                    }
                }
            }
            Button("Discard", role: .destructive) {
                cm.detailHasUnsavedChanges = false
                cm.pendingSaveConfiguration = nil
                let pending = pendingTabIndex
                pendingTabIndex = nil
                if let pending { selectedSideMenuTab = pending }
            }
            Button("Cancel", role: .cancel) {
                pendingTabIndex = nil
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

#Preview {
    @Previewable @State var mockPresentSideMenu = false

    let mockCM = ConfigurationsViewModel(withMockData: true)
    
    HomeScreen()
        .environmentObject(DevicesViewModel())
        .environmentObject(PreferenceViewModel(userDefaults: UserDefaults.standard))
        .environmentObject(mockCM)
}
