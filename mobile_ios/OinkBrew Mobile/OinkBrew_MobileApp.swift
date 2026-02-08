import SwiftUI

@main
struct OinkBrew_MobileApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    @StateObject var preferenceViewModel = PreferenceViewModel(userDefaults: UserDefaults.standard)
    @StateObject var userStateViewModel = UserStateViewModel()
    @StateObject var devicesViewModel = DevicesViewModel()
    @StateObject var configurationsViewModel = ConfigurationsViewModel()

    @State private var isRestoreComplete = false

    var body: some Scene {
        WindowGroup {
            if isRestoreComplete {
                NavigationView {
                    ApplicationSwitcher()
                }
                .navigationViewStyle(.stack)
                .environmentObject(preferenceViewModel)
                .environmentObject(userStateViewModel)
                .environmentObject(devicesViewModel)
                .environmentObject(configurationsViewModel)
                .onAppear { wireAPIServiceToUserState() }
            } else {
                SplashView()
                    .task { await performRestore() }
                    .environmentObject(preferenceViewModel)
                    .environmentObject(userStateViewModel)
                    .environmentObject(devicesViewModel)
                    .environmentObject(configurationsViewModel)
            }
        }
    }

    private func performRestore() async {
        let tokens = SecureTokenStorage.load(prompt: "Unlock OinkBrew to sign in")
        if let t = tokens {
            userStateViewModel.restoreTokens(t)
        }
        isRestoreComplete = true
    }

    private func wireAPIServiceToUserState() {
        let vm = userStateViewModel
        APIService.shared.getAccessToken = { vm.currentAccessToken }
        APIService.shared.onRefresh = {
            let result = await Task { @MainActor in
                await vm.refreshAccessToken()
            }.value
            if case .success(let ok) = result { return ok }
            return false
        }
        APIService.shared.onSignOut = {
            await Task { @MainActor in
                _ = await vm.signOut()
            }.value
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

private struct SplashView: View {
    var body: some View {
        ZStack {
            BackgroundStartUpView()
        }
        .ignoresSafeArea()
    }
}
