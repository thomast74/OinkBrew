import Foundation
import SwiftUI
import Argon2Swift

enum UserStateError: Error {
    case signUpCreateUser,
         signUpNoToken,
         signUpConfirmToken,
         signInLoginError,
         signInNoToken,
         signInConfirmToken,
         signOutError
}

struct AccessTokens: Codable {
    let accessToken: String
    let refreshToken: String
}

struct SignUpTokensDto: Codable {
    var otpToken: String
    var otpUrl: String
    var otpBarcode: String
    var userId: Int
}

struct SignInTokensDto: Codable {
    var otpToken: String
    var userId: Int
}

@MainActor
class UserStateViewModel: ObservableObject {

    @Published var isSignedIn = false
    @Published var needsSignUp = false
    @Published var isBusy = false
    
    private let preferences = Preferences.shared
    
    private(set) var accessTokens: AccessTokens?
    private var signupTokens: SignUpTokensDto?
    private var signinTokens: SignInTokensDto?
    private let session: URLSession
    
    init(urlSession: URLSession = .shared, signupTokens: SignUpTokensDto? = nil, signinTokens: SignInTokensDto? = nil) {
        self.session = urlSession
        self.signupTokens = signupTokens
        self.signinTokens = signinTokens
    }
    
    func signUp(email: String, password: String) async -> Result<SignUpTokensDto, UserStateError>  {
        isBusy = true
        do {
            let url = URL(string: "\(preferences.correctedApiUrl())/auth/signup")!
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = createBodyData(from: ["email": email, "password": password])
            
            let (data, response) = try await session.data(for: request)
                        
            if let httpResponse = response.http, httpResponse.statusCode == 200 {
                var tokens = try JSONDecoder().decode(SignUpTokensDto.self, from: data)
                tokens.otpBarcode = convertImageBase64(tokens.otpBarcode)
                signupTokens = tokens
                
                isBusy = false
                return .success(tokens)
            }

            isBusy = false
            return .failure(.signUpCreateUser)
        } catch {
            isBusy = false
            return .failure(.signUpCreateUser)
        }
    }
    
    func signUpOtp(otp: String) async -> Result<Bool, UserStateError> {
        isBusy = true
        do {
            if signupTokens == nil {
                isBusy = false
                return .failure(.signUpNoToken)
            }
            
            let url = URL(string: "\(preferences.correctedApiUrl())/auth/signupOtp")!
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(signupTokens!.otpToken)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = createBodyData(from: [
                "userId": signupTokens?.userId ?? 0,
                "otpPassword": otp
            ])
            
            let (data, response) = try await session.data(for: request)

            if let httpResponse = response.http, httpResponse.statusCode == 200 {
                accessTokens = try JSONDecoder().decode(AccessTokens.self, from: data)
                
                isSignedIn = true
                needsSignUp = false
                isBusy = false
                return .success(true)
            }
            
            isBusy = false
            return .failure(.signUpConfirmToken)
        } catch {
            isBusy = false
            return .failure(.signUpConfirmToken)
        }
    }
    
    func signIn(email: String, password: String) async -> Result<Bool, UserStateError>  {
        isBusy = true
        do {
            let url = URL(string: "\(preferences.correctedApiUrl())/auth/signin")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = createBodyData(from: ["email": email, "password": password])
            
            let (data, response) = try await session.data(for: request)
                        
            if let httpResponse = response.http, httpResponse.statusCode == 200 {
                signinTokens = try JSONDecoder().decode(SignInTokensDto.self, from: data)
                
                isBusy = false
                return .success(true)
            }

            isBusy = false
            return .failure(.signInLoginError)
        } catch {
            isBusy = false
            return .failure(.signInLoginError)
        }
    }
    
    func signInOtp(otp: String) async -> Result<Bool, UserStateError> {
        isBusy = true
        do {
            if signinTokens == nil {
                isBusy = false
                return .failure(.signInNoToken)
            }
            
            let url = URL(string: "\(preferences.correctedApiUrl())/auth/signinOtp")!
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(signinTokens!.otpToken)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = createBodyData(from: [
                "userId": signinTokens?.userId ?? 0,
                "otpPassword": otp
            ])
            
            let (data, response) = try await session.data(for: request)
                        
            if let httpResponse = response.http, httpResponse.statusCode == 200 {
                accessTokens = try JSONDecoder().decode(AccessTokens.self, from: data)
                
                isSignedIn = true
                isBusy = false
                return .success(true)
            }
            
            isBusy = false
            return .failure(.signInConfirmToken)
        } catch {
            isBusy = false
            return .failure(.signInConfirmToken)
        }
    }

    func signOut() async -> Result<Bool, UserStateError>  {
        isBusy = true
        do {
            try await Task.sleep(nanoseconds: 1_000_000_000)
            accessTokens = nil
            signupTokens = nil
            signinTokens = nil
            
            isSignedIn = false
            isBusy = false
            return .success(true)
        } catch {
            isBusy = false
            return .failure(.signOutError)
        }
    }
    
    private func createBodyData(from rawData: [String: Any]) -> Data? {
        return try? JSONSerialization.data(withJSONObject: rawData)
    }
    
    private func convertImageBase64(_ receivedBase64: String) -> String {
        let typeAndData = receivedBase64.split{$0 == ";"}.map(String.init)
        let fileDataString = typeAndData[1].split{$0 == ","}.map(String.init)
        let base64 = fileDataString[1]
        
        return base64
    }
}

