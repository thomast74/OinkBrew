import SwiftUI

struct LoginView: View {
    
    @EnvironmentObject var credentials: LoginViewModel
    
    var body: some View {
        VStack {
            TextField(
                "Username",
                text: self.$credentials.username)
                .disableAutocorrection(true)
            SecureField(
                "Password",
                text: self.$credentials.password)
            Text(self.$credentials.error.wrappedValue)
            Button("Login") {
                self.credentials.login();
            }
        }.onAppear(perform: {
            self.credentials.checkBiometric()
        }).textFieldAlert(isPresented: self.$credentials.otpNeeded) { () -> TextFieldAlert in
            TextFieldAlert(
                title: "OTP Needed",
                message: "Please enter the OTP from the authenticator app",
                text: self.$credentials.otp,
                okHandler: self.credentials.otpEntered
            )}
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView().environmentObject(LoginView.LoginViewModel())
    }
}
