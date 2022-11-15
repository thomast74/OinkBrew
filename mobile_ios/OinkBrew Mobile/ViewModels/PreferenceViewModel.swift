import Foundation
import SwiftUI

enum PreferenceStateError: Error {
    case invalidUrl
    case saveError
}

class PreferenceViewModel: ObservableObject {

    @Published var available = false
    
    private let preferences = Preferences.shared
    private let userDefaults: UserDefaults
    
    init(userDefaults: UserDefaults) {
        self.userDefaults = userDefaults
        preferences.apiUrl = self.userDefaults.string(forKey: PREF_ApiUrl) ?? ""
        
        available = allPreferencesAvailable
    }
    
    var allPreferencesAvailable: Bool {
        get {
            return hasApiUrl
        }
    }
    
    var hasApiUrl: Bool {
        get {
            debugPrint(preferences.apiUrl)
            return !preferences.apiUrl.isEmpty
        }
    }
    
    var apiUrl: String {
        get {
            return preferences.apiUrl
        }
    }
    
    func save(apiUrl: String) async -> Result<Bool, PreferenceStateError>  {
        
        guard let url = URL(string: apiUrl) else {
            available = false
            return .failure(.invalidUrl)
        }
        
        if await !UIApplication.shared.canOpenURL(url) {
            available = false
            return .failure(.invalidUrl)
        }
        
        userDefaults.set(url.absoluteString, forKey: PREF_ApiUrl)
        preferences.apiUrl = apiUrl
        
        available = allPreferencesAvailable
        
        return .success(true)
    }
}
