import Foundation

class Preferences {
    
    static let shared = Preferences()
    
    var apiUrl: String = ""
    
    private init() {}
    
    func correctedApiUrl() -> String {
        if apiUrl.hasSuffix("/") {
            apiUrl = String(apiUrl.dropLast())
        }
        
        return apiUrl
    }
}
