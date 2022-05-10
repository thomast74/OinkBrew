import SwiftUI

struct SignUpScreen: View {

    @EnvironmentObject var userState: UserStateViewModel
    @State var email = ""
    @State var password = ""

    fileprivate func EmailInput() -> some View {
        TextField("Email", text: $email)
            .keyboardType(.emailAddress)
            .disableAutocorrection(true)
            .autocapitalization(.none)
            .textFieldStyle(.roundedBorder)
    }

    fileprivate func PasswordInput() -> some View {
        SecureField("Password", text: $password)
            .textFieldStyle(.roundedBorder)
    }

    fileprivate func CreateButton() -> some View {
        Button(action: {
            Task {
                await userState.signUp(
                    email: email,
                    password:password
                )
            }
        }) {
            Text("Create")
        }
    }

    var body: some View {

        VStack{
            if userState.isBusy {
                ProgressView()
            } else {
                Text("Login Screen").font(.title)
                EmailInput()
                PasswordInput()
                CreateButton()
            }
        }.padding()
    }
}
