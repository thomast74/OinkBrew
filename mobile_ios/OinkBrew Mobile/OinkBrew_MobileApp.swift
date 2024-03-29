import SwiftUI

@main
struct OinkBrew_MobileApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    @StateObject var preferenceViewModel = PreferenceViewModel(userDefaults: UserDefaults.standard)
    @StateObject var userStateViewModel = UserStateViewModel()
    
    var body: some Scene {
        WindowGroup {
            NavigationView{
                ApplicationSwitcher()
            }
            .navigationViewStyle(.stack)
            .environmentObject(preferenceViewModel)
            .environmentObject(userStateViewModel)
        }
    }
}

struct ApplicationSwitcher: View {

    @EnvironmentObject var preference: PreferenceViewModel
    @EnvironmentObject var userState: UserStateViewModel
    
    var body: some View {
        Group {
            if (!preference.available) {
                PreferenceScreen()
            } else if (userState.needsSignUp) {
                SignUpScreen()
            } else if (!userState.isSignedIn) {
                SignInScreen()
            } else {
                HomeScreen()
            }
        }
    }
}
