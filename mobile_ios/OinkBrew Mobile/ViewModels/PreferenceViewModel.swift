import Foundation
import SwiftUI

enum PreferenceStateError: Error {
    case invalidUrl
    case saveError
}

class PreferenceViewModel: ObservableObject {

    @Published var apiUrl = ""
    
    private let userDefaults: UserDefaults
    
    init(userDefaults: UserDefaults) {
        self.userDefaults = userDefaults
        apiUrl = self.userDefaults.string(forKey: PREF_ApiUrl) ?? ""
    }
    
    var hasApiUrl: Bool {
        get {
            debugPrint(apiUrl)
            return !apiUrl.isEmpty
        }
    }
    
    func save(apiUrl: String) async -> Result<Bool, PreferenceStateError>  {
        
        guard let url = URL(string: apiUrl) else {
            return .failure(.invalidUrl)
        }
        
        if await !UIApplication.shared.canOpenURL(url) {
            return .failure(.invalidUrl)
        }
        
        userDefaults.set(url.absoluteString, forKey: PREF_ApiUrl)
        self.apiUrl = apiUrl
        
        return .success(true)
    }
}
