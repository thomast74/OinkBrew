import Foundation
import os
import LocalAuthentication
import Particle_SDK

extension LoginView {
    class LoginViewModel: ObservableObject {
        @Published public var username: String = ""
        @Published public var password: String = ""
        @Published public var error: String = ""
        @Published public var otp: String?
        @Published public var otpNeeded: Bool = false
                
        private var context = LAContext()
        private let server = "www.particle.io"
        private var mfa_token: String?
        private let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "login")
        
        func checkBiometric() {
            self.enableBiometric {
                self.loadKeychainData()
            }
        }
        
        func loadKeychainData() {
            var itemCopy: AnyObject?
            guard let account = UserDefaults.standard.string(forKey: "account") else {
                self.logger.error("No account in user defaults")
                return
            }
            
            let query: [String: Any] = [
                kSecClass as String: kSecClassInternetPassword,
                kSecMatchLimit as String: kSecMatchLimitOne,
                kSecReturnData as String: kCFBooleanTrue!,
                kSecAttrServer as String: server,
                kSecAttrAccount as String: account,
            ]
            let status = SecItemCopyMatching(
                query as CFDictionary,
                &itemCopy
            )
            
            guard status != errSecItemNotFound else {
                self.logger.error("No password found in keychain")
                return
            }
            
            guard status == errSecSuccess else {
                self.logger.error("Retrieving password was not successful")
                return
            }
            
            guard let secret = itemCopy as? Data else {
                self.logger.error("Convert password to string failed")
                return
            }

            DispatchQueue.main.async { [unowned self] in
                username = account
                password = String(decoding: secret, as: UTF8.self)
            }
            login(savePassword: false)
        }
        
        func login(savePassword: Bool = true) {
            logger.debug("Request to login with \(self.username) and \(self.password)")
            
            ParticleCloud.sharedInstance().login(withUser: self.username, password: self.password) { (error:Error?) -> Void in
                guard let e = error as NSError? else {
                    self.logger.debug("Successfully logged in")
                    return
                }

                guard let userInfo = e.userInfo[ParticleSDKErrorResponseBodyKey] as? [String: String] else {
                    self.logger.debug("Login failed Error: \(e.localizedDescription)")
                    self.error = e.localizedDescription
                    return

                }

                if userInfo["error"] == "mfa_required" {
                    self.mfa_token = userInfo["mfa_token"]
                    self.otpNeeded = true
                } else {
                    self.logger.debug("Login failed Error: \(e.localizedDescription)")
                    self.error = e.localizedDescription
                }
            }
            
            if (savePassword) {
                enableBiometric {
                    self.saveCredentialsAfterLogin()
                }
            }
        }
        
        func otpEntered() {
            otpNeeded = false
            logger.debug("OTP Entered \(self.otp ?? "")")
            ParticleCloud.sharedInstance().login(withUser: self.username, mfaToken: self.mfa_token ?? "", otpToken: self.otp ?? "") { (error:Error?) -> Void in
                if let e = error {
                    self.logger.debug("Login failed Error: \(e.localizedDescription)")
                    self.error = e.localizedDescription
            }
                else {
                    self.logger.debug("Successfully logged in")
                }
            }
        }
        
        func saveCredentialsAfterLogin() {
            let account = username
            let secret = password.data(using: String.Encoding.utf8)!

            UserDefaults.standard.set(account, forKey: "account")
            
            let query: [String: Any] = [
                kSecClass as String: kSecClassInternetPassword,
                kSecAttrAccount as String: account,
                kSecAttrServer as String: server,
                kSecValueData as String: secret
            ]
            
            let status = SecItemAdd(query as CFDictionary, nil)
            guard status == errSecSuccess else {
                self.logger.error("Not able to store password in keychain \(status)")
                return
            }
        }
        
        func enableBiometric(successCallback: @escaping () -> Void) {
            let reason = "Log in to your particle cloud"
            context.touchIDAuthenticationAllowableReuseDuration = 10
            context.localizedCancelTitle = "Enter Username/Password"
            context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason ) { success, error in
                if success {
                    successCallback()
                } else {
                    self.logger.error("\(error?.localizedDescription ?? "Failed to authenticate")")
                }
            }
        }
    }
}
