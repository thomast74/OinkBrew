import Foundation

enum APIError: Error{
    case invalidUrl, requestError, decodingError, statusNotOk, notSignedIn
}

enum DateError: String, Error {
    case invalidDate
}

struct APIService {
    
    private let preferences = Preferences.shared
    
    func getConfigurations() async throws -> [BeerConfiguration] {
        
        guard let accessTokens = preferences.accessTokens else{
            throw APIError.notSignedIn
        }
        
        guard let url = URL(string:  "\(preferences.correctedApiUrl())/configurations") else{
            throw APIError.invalidUrl
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessTokens)", forHTTPHeaderField: "Authorization")
        
        guard let (data, response) = try? await URLSession.shared.data (for: request) else {
            throw APIError.requestError
        }
        
        guard let response = response as? HTTPURLResponse, response.statusCode == 200 else {
            throw APIError.statusNotOk
        }
        
        guard let result = try? JSONDecoder().decode([BeerConfiguration].self, from: data) else {
            throw APIError.decodingError
        }
        
        return result
    }
    
    func getDevices() async throws -> [Device] {
        guard let accessTokens = preferences.accessTokens else{
            throw APIError.notSignedIn
        }
        
        guard let url = URL(string:  "\(preferences.correctedApiUrl())/devices") else{
            throw APIError.invalidUrl
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessTokens.accessToken)", forHTTPHeaderField: "Authorization")
        
        guard let (data, response) = try? await URLSession.shared.data (for: request) else {
            throw APIError.requestError
        }
        
        guard let response = response as? HTTPURLResponse, response.statusCode == 200 else {
            print(response)
            throw APIError.statusNotOk
        }

        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom({ (decoder) -> Date in
            let container = try decoder.singleValueContainer()
            let dateStr = try container.decode(String.self)

            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX"
            if let date = formatter.date(from: dateStr) {
                return date
            }
            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssXXXXX"
            if let date = formatter.date(from: dateStr) {
                return date
            }
            throw DateError.invalidDate
        })
        
        
        do {
            let result = try decoder.decode([Device].self, from: data)
            return result
        } catch let DecodingError.dataCorrupted(context) {
            print(context)
            throw APIError.decodingError
        } catch let DecodingError.keyNotFound(key, context) {
            print("Key '\(key)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
            throw APIError.decodingError
        } catch let DecodingError.valueNotFound(value, context) {
            print("Value '\(value)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
            throw APIError.decodingError
        } catch let DecodingError.typeMismatch(type, context)  {
            print("Type '\(type)' mismatch:", context.debugDescription)
            print("codingPath:", context.codingPath)
            throw APIError.decodingError
        } catch {
            print("error: ", error)
            throw APIError.decodingError
        }
    }
}
