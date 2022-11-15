import SwiftUI

struct SignUpScreen: View {

    @EnvironmentObject var userState: UserStateViewModel
    @State var email = ""
    @State var password = ""
    @State var otp = ""
    @State var otpUrl = ""
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
        }
    }

    fileprivate func PasswordInput() -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Label("Password", systemImage: "bolt.fill")
                .labelStyle(.titleOnly)
            SecureField("", text: $password)
                .textFieldStyle(RoundedBorderLightTextFieldStyle())
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
        }
    }

    fileprivate func CreateButton() -> some View {
        Button(action: {
            isPerformingTask = true
            Task {
                let response = await userState.signUp(
                    email: email,
                    password:password
                )
                    
                let tokens = try response.get()
                otpUrl = tokens.otpUrl
                if let data = Data(base64Encoded: tokens.otpBarcode), let uiImage = UIImage(data: data) {
                    self.barcode = uiImage
                }
                self.isConfirmOtp = true
                    
                isPerformingTask = false
            }
        }) {
            Text("Create")
        }
        .buttonStyle(ActionButtonStyle())
        .disabled(isPerformingTask)
    }
    
    fileprivate func ConfirmButton() -> some View {
        Button(action: {
            isPerformingTask = true
            Task {
                let _ = await userState.signUpOtp(otp: self.otp)
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
                                .foregroundColor(.white)
                                .padding(.top, 0)
                                .padding(.bottom, 10)
                        }
                        Image(uiImage: barcode)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width:178, height:178)
                            .padding(.top, 12)
                        Link("Open in your OTP app",
                              destination: URL(string: otpUrl)!)
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
