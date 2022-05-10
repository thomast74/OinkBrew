import SwiftUI

struct HomeScreen: View {

    @EnvironmentObject var preference: PreferenceViewModel
    @EnvironmentObject var userState: UserStateViewModel

    var body: some View {
        if userState.isBusy {
            ProgressView()
        } else {
            Text("Home Screen")
                .navigationTitle("Home")
                .toolbar {
                    Button {
                        Task{
                            await userState.signOut()
                        }
                    } label: {
                        Image(systemName:  "rectangle.portrait.and.arrow.right")
                    }
                }
        }
    }
}
