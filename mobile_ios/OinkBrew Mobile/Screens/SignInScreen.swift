import SwiftUI

struct SignInScreen: View {

    @EnvironmentObject var userState: UserStateViewModel
    @State var email = ""
    @State var password = ""
    @State var otp = ""
    @State private var isPerformingTask = false
    @State private var isConfirmOtp = false
    @State private var errorMessage = ""
    
    private let proportion = 0.50

    fileprivate func EmailInput() -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Label("Email", systemImage: "bolt.fill")
                .labelStyle(.titleOnly)
            TextField("", text: $email)
                .keyboardType(.emailAddress)
                .textContentType(.emailAddress)
                .disableAutocorrection(true)
                .autocapitalization(.none)
                .textFieldStyle(RoundedBorderLightTextFieldStyle())
                .accessibility(identifier: "Email")
        }
    }

    fileprivate func PasswordInput() -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Label("Password", systemImage: "bolt.fill")
                .labelStyle(.titleOnly)
            SecureField("", text: $password)
                .textFieldStyle(RoundedBorderLightTextFieldStyle())
                .accessibility(identifier: "Password")
        }
    }
    
    fileprivate func ConfirmOtpInput() -> some View {
        VStack(alignment: .center, spacing: 4) {
            Label("Enter OTP", systemImage: "bolt.fill")
                .labelStyle(.titleOnly)
            TextField("", text: $otp)
                .keyboardType(.numberPad)
                .disableAutocorrection(true)
                .autocapitalization(.none)
                .textFieldStyle(RoundedBorderLightTextFieldStyle())
                .multilineTextAlignment(.center)
                .accessibility(identifier: "Cornfirm OTP")
        }
    }

    fileprivate func LoginButton() -> some View {
        Button(action: {
            isPerformingTask = true
            errorMessage = ""
            Task {
                let result = await userState.signIn(
                    email: email,
                    password:password
                )
                isPerformingTask = false
                switch result {
                case .failure(.signInApiError):
                    errorMessage = "API Error"
                case .failure(.signInLoginError):
                    errorMessage = "Username or password wrong"
                case .failure(.signInNoToken):
                    errorMessage = "No OTP Token"
                case .failure(.signInConfirmToken):
                    errorMessage = "OTP Token not confirmed"
                case .success(_):
                    do {
                        isConfirmOtp = try result.get()
                    } catch {
                        errorMessage = "Username or password wrong"
                    }
                    break
                }
            }
        }) {
            Text("Sign In")
        }
        .buttonStyle(ActionButtonStyle())
        .disabled(isPerformingTask)
    }
    
    fileprivate func ConfirmButton() -> some View {
        Button(action: {
            isPerformingTask = true
            errorMessage = ""
            Task {
                let response = await userState.signInOtp(otp: self.otp)
                
                do {
                    let _ = try response.get()
                    isConfirmOtp = false
                } catch {
                    let userError = error as! SignInError

                    switch userError {
                    case .signInNoToken:
                        errorMessage = "No OTP token received"
                    default:
                        errorMessage = "OTP is not correct"
                    }
                }
                isPerformingTask = false
            }
        }) {
            Text("Confirm")
        }
        .buttonStyle(ActionButtonStyle())
        .disabled(isPerformingTask)
    }
    
    fileprivate func SignUpButton() -> some View {
        Button(action: {
            isPerformingTask = true
            Task {
                userState.needsSignUp = true
            }
        }) {
            Text("No Account yet? Sign Up")
        }
        .buttonStyle(ActionButtonStyle())
        .disabled(isPerformingTask)
    }

    var body: some View {
        ZStack {
            BackgroundStartUpView()
            GeometryReader { geometry in
                Rectangle()
                    .fill(Color.black)
                    .opacity(0.4)
                    .cornerRadius(25)
                    .withProportionAndCenter(geometry, proportion)
                VStack{
                    if userState.isBusy {
                        ProgressView()
                    } else if (isConfirmOtp) {
                        Text("Confirm OTP")
                            .font(.title)
                            .foregroundColor(.white)
                            .padding(.top, 44)
                            .padding(.bottom, 12)
                        if !errorMessage.isEmpty {
                            Text(errorMessage)
                                .font(.headline)
                                .foregroundColor(.red)
                                .foregroundColor(.white)
                                .padding(.top, 0)
                                .padding(.bottom, 10)
                        }
                        ConfirmOtpInput()
                            .padding(.top, 12)
                            .padding(.horizontal, 66)
                            .padding(.bottom, 22)
                        ConfirmButton()
                            .padding(.bottom, 44)
                        Spacer()
                    } else {
                        Text("Login")
                            .font(.title)
                            .foregroundColor(.white)
                            .padding(.top, 44)
                            .padding(.bottom, 12)
                        if !errorMessage.isEmpty {
                            Text(errorMessage)
                                .font(.headline)
                                .foregroundColor(.red)
                                .foregroundColor(.white)
                                .padding(.top, 0)
                                .padding(.bottom, 10)
                        }
                        EmailInput()
                            .padding(.top, 12)
                            .padding(.horizontal, 22)
                        PasswordInput()
                            .padding(.top, 4)
                            .padding(.horizontal, 22)
                            .padding(.bottom, 22)
                        LoginButton()
                        Spacer()
                        SignUpButton()
                            .padding(.bottom, 44)
                        
                    }
                }.withProportionAndCenter(geometry, proportion)
            }
        }.edgesIgnoringSafeArea(.all)
         .preferredColorScheme(.dark)
    }
}
