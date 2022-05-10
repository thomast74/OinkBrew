import Foundation

enum UserStateError: Error {
    case signInError, signOutError
}

@MainActor
class UserStateViewModel: ObservableObject {

    @Published var isLoggedIn = false
    @Published var isBusy = false
    
    func signUp(email: String, password: String) async -> Result<Bool, UserStateError>  {
        isBusy = true
        do {
            try await Task.sleep(nanoseconds:  1_000_000_000)
            isLoggedIn = false
            isBusy = false
            return .success(true)
        } catch {
            isBusy = false
            return .failure(.signInError)
        }
    }
    
    func signUpOtp(otp: String) async -> Result<Bool, UserStateError> {
        isBusy = true
        do {
            try await Task.sleep(nanoseconds:  1_000_000_000)
            isLoggedIn = true
            isBusy = false
            return .success(true)
        } catch {
            isBusy = false
            return .failure(.signInError)
        }
    }
    
    func signIn(email: String, password: String) async -> Result<Bool, UserStateError>  {
        isBusy = true
        do {
            try await Task.sleep(nanoseconds:  1_000_000_000)
            isLoggedIn = false
            isBusy = false
            return .success(true)
        } catch {
            isBusy = false
            return .failure(.signInError)
        }
    }
    
    func signInOtp(otp: String) async -> Result<Bool, UserStateError> {
        isBusy = true
        do {
            try await Task.sleep(nanoseconds:  1_000_000_000)
            isLoggedIn = true
            isBusy = false
            return .success(true)
        } catch {
            isBusy = false
            return .failure(.signInError)
        }
    }

    func signOut() async -> Result<Bool, UserStateError>  {
        isBusy = true
        do {
            try await Task.sleep(nanoseconds: 1_000_000_000)
            isLoggedIn = false
            isBusy = false
            return .success(true)
        } catch {
            isBusy = false
            return .failure(.signOutError)
        }
    }
}

