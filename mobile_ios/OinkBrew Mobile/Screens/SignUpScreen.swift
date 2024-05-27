import SwiftUI

struct SignUpScreen: View {

    @EnvironmentObject var userState: UserStateViewModel
    @State var email = ""
    @State var password = ""
    @State var otp = ""
    @State var otpUrl = ""
    @State var otpSecret = ""
    @State private var isPerformingTask = false
    @State private var isConfirmOtp = false
    @State private var barcode = UIImage()
    @State private var errorMessage = ""
    
    private let proportion = 0.50
    
    fileprivate func EmailInput() -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Label("Email", systemImage: "bolt.fill")
                .labelStyle(.titleOnly)
            TextField("", text: $email)
                .keyboardType(.emailAddress)
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
            Label("Confirm OTP", systemImage: "bolt.fill")
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

    fileprivate func CreateButton() -> some View {
        Button(action: {
            isPerformingTask = true
            errorMessage = ""
            Task {
                let response = await userState.signUp(
                    email: email,
                    password: password
                )
                
                isPerformingTask = false
                switch response {
                case .failure(.signUpNoEmail):
                    errorMessage = "You must provide an email"
                case .failure(.signUpNoPassword):
                    errorMessage = "You must provide a password"
                case .failure(.signUpApiError):
                    errorMessage = "API Error"
                case .failure(.signUpCreateUser):
                    errorMessage = "User could not be created"
                case .failure(.signUpNoToken):
                    errorMessage = "No OTP token received"
                case .failure(.signUpConfirmToken):
                    errorMessage = "OTP is not correct"
                case .success(_):
                    do {
                        let tokens = try response.get()
                        otpUrl = tokens.otpUrl
                        otpSecret = getQueryStringParameter(url: tokens.otpUrl, param: "secret") ?? ""
                        if let data = Data(base64Encoded: tokens.otpBarcode), let uiImage = UIImage(data: data) {
                            self.barcode = uiImage
                        }
                        self.isConfirmOtp = true
                    } catch {
                        errorMessage = "User could not be created"
                    }
                }
            }
        }) {
            Text("Create")
        }
        .buttonStyle(ActionButtonStyle())
        .disabled(isPerformingTask)
    }
    
    fileprivate func getQueryStringParameter(url: String, param: String) -> String? {
      guard let url = URLComponents(string: url) else { return nil }
      return url.queryItems?.first(where: { $0.name == param })?.value
    }
    
    fileprivate func ConfirmButton() -> some View {
        Button(action: {
            isPerformingTask = true
            errorMessage = ""
            Task {
                let response = await userState.signUpOtp(otp: self.otp)
                
                do {
                    let _ = try response.get()
                    isConfirmOtp = false
                } catch {
                    let userError = error as! SignUpError

                    switch userError {
                    case .signUpNoToken:
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

    var body: some View {
        ZStack {
            BackgroundStartUpView()
            GeometryReader { geometry in
                Rectangle()
                    .fill(Color.black)
                    .opacity(0.4)
                    .cornerRadius(25)
                    .withProportionAndCenter(geometry, proportion)
                VStack {
                    if userState.isBusy {
                        ProgressView()
                    } else if (isConfirmOtp) {
                        Text("Setup & Confirm OTP")
                            .font(.title)
                            .foregroundColor(.white)
                            .padding(.top, 44)
                            .padding(.bottom, 12)
                        if !errorMessage.isEmpty {
                            Text(errorMessage)
                                .font(.headline)
                                .foregroundColor(.red)
                                .padding(.top, 0)
                                .padding(.bottom, 10)
                        }
                        Image(uiImage: barcode)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width:90, height:90)
                            .padding(.top, 12)
                        Text("Manual: \(otpSecret)")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.top, 0)
                            .padding(.bottom, 10)
                            .accessibilityIdentifier("Manual Secret")
                        ConfirmOtpInput()
                            .padding(.top, 22)
                            .padding(.horizontal, 66)
                            .padding(.bottom, 22)
                        ConfirmButton()
                            .padding(.bottom, 44)
                        Spacer()
                    } else {
                        Text("Sign Up")
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
                        CreateButton()
                            .padding(.bottom, 44)
                        Spacer()
                    }
                }.withProportionAndCenter(geometry, proportion)
            }
        }.edgesIgnoringSafeArea(.all)
         .preferredColorScheme(.dark)

    }
}
