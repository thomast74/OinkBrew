import SwiftUI

struct HomeScreen: View {
    @State var presentSideMenu = false
    @State var selectedSideMenuTab = 0
    
    var body: some View {
        ZStack {
            TabView(selection: $selectedSideMenuTab) {
                ConfigurationsView(presentSideMenu: $presentSideMenu)
                    .toolbar(.hidden, for: .tabBar)
                    .tag(0)
                DevicesListView(presentSideMenu: $presentSideMenu)
                    .toolbar(.hidden, for: .tabBar)
                    .tag(1)
            }
            
            SideMenuScreen(
                isShowing: $presentSideMenu,
                content: AnyView(SideMenuView(selectedSideMenuTab: $selectedSideMenuTab,
                                              presentSideMenu: $presentSideMenu)))
        }
    }
}

#Preview {
    HomeScreen().environmentObject(DevicesViewModel())
}
