import Foundation

enum APIError: Error {
    case invalidUrl, requestError, decodingError, statusNotOk, notSignedIn
    case serverMessage(String)
}

enum DateError: String, Error {
    case invalidDate
}

class APIService {

    static let shared = APIService()

    /// Called to obtain the current access token (e.g. from UserStateViewModel). Set at app launch.
    var getAccessToken: (() -> String?)?
    /// Called when a 401 is received to refresh tokens. Set at app launch.
    var onRefresh: (() async -> Bool)?
    /// Called when the app should sign out (e.g. not signed in or second 401). Set at app launch.
    var onSignOut: (() async -> Void)?

    private let preferences = Preferences.shared

    private init() {}

    /// Performs an authenticated request: gets token, builds request, executes. On 401, refreshes once and retries; second 401 triggers sign-out and requestError.
    func performAuthenticatedRequest<T>(
        buildingRequest: (String) -> URLRequest,
        parseResponse: (Data, HTTPURLResponse) throws -> T
    ) async throws -> T {
        guard var token = getAccessToken?() else {
            await onSignOut?()
            throw APIError.notSignedIn
        }
        var didRetry401 = false

        while true {
            let request = buildingRequest(token)
            let (data, httpResponse) = try await performRequest(request)
            if (200...299).contains(httpResponse.statusCode) {
                return try parseResponse(data, httpResponse)
            }
            guard httpResponse.statusCode == 401 else {
                throw APIError.requestError
            }
            if didRetry401 {
                await onSignOut?()
                throw APIError.requestError
            }
            guard await onRefresh?() == true, let newToken = getAccessToken?() else {
                await onSignOut?()
                throw APIError.requestError
            }
            token = newToken
            didRetry401 = true
        }
    }

    private func performRequest(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.requestError
        }
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestError
        }
        return (data, httpResponse)
    }

    func getConfigurations(archived: Bool = false) async throws -> [BeerConfiguration] {
        var components = URLComponents(string: "\(preferences.correctedApiUrl())/configurations")
        components?.queryItems = [URLQueryItem(name: "archived", value: archived ? "true" : "false")]
        guard let url = components?.url else {
            throw APIError.invalidUrl
        }
        return try await performAuthenticatedRequest(
            buildingRequest: { token in
                var request = URLRequest(url: url)
                request.httpMethod = "GET"
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                return request
            },
            parseResponse: { data, _ in
                do {
                    let result = try Self.responseJSONDecoder.decode([BeerConfiguration].self, from: data)
                    return result
                } catch {
                    print("\(error)")
                    throw APIError.decodingError
                }
            }
        )
    }

    /// Archives a configuration. Calls DELETE /configurations/{id}.
    func archiveConfiguration(id: Int) async throws {
        guard let url = URL(string: "\(preferences.correctedApiUrl())/configurations/\(id)") else {
            throw APIError.invalidUrl
        }
        let _: Void = try await performAuthenticatedRequest(
            buildingRequest: { token in
                var request = URLRequest(url: url)
                request.httpMethod = "DELETE"
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                return request
            },
            parseResponse: { _, _ in () }
        )
    }

    /// Updates a configuration (e.g. to set archived: false). Calls PUT /configurations/{id} with full body.
    func updateConfiguration(_ configuration: BeerConfiguration) async throws {
        guard let url = URL(string: "\(preferences.correctedApiUrl())/configurations/\(configuration.id)") else {
            throw APIError.invalidUrl
        }
        let body = buildConfigurationRequestBody(configuration)
        let bodyData = try JSONSerialization.data(withJSONObject: body)
        let _: Void = try await performAuthenticatedRequest(
            buildingRequest: { token in
                var request = URLRequest(url: url)
                request.httpMethod = "PUT"
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = bodyData
                return request
            },
            parseResponse: { _, _ in () }
        )
    }

    /// Creates a configuration. POST /configurations. Returns the created configuration with device populated.
    func createConfiguration(_ payload: CreateConfigurationPayload) async throws -> BeerConfiguration {
        guard let url = URL(string: "\(preferences.correctedApiUrl())/configurations") else {
            throw APIError.invalidUrl
        }
        let body = buildConfigurationRequestBody(payload)
        let bodyData = try JSONSerialization.data(withJSONObject: body)
        return try await performAuthenticatedRequest(
            buildingRequest: { token in
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = bodyData
                return request
            },
            parseResponse: { data, _ in
                do {
                    let result = try Self.responseJSONDecoder.decode(BeerConfiguration.self, from: data)
                    return result
                } catch {
                    print("\(error)")
                    throw APIError.decodingError
                }
            }
        )
    }
    
    /// PUT /devices/{id}/{hwAddress}/{pinNr} with body { name, offset }. Updates connected device name and offset.
    func updateConnectedDevice(deviceId: String, pinNr: Int, hwAddress: String, name: String, offset: Double) async throws {
        let encodedHw = hwAddress.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? hwAddress
        let path = "\(preferences.correctedApiUrl())/devices/\(deviceId)/\(encodedHw)/\(pinNr)"
        guard let url = URL(string: path) else {
            throw APIError.invalidUrl
        }
        let body: [String: Any] = ["name": name, "offset": offset]
        let bodyData = try JSONSerialization.data(withJSONObject: body)
        let _: Void = try await performAuthenticatedRequest(
            buildingRequest: { token in
                var request = URLRequest(url: url)
                request.httpMethod = "PUT"
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = bodyData
                return request
            },
            parseResponse: { _, _ in () }
        )
    }
    
    private func buildConfigurationRequestBody(_ source: ConfigurationBodyConvertible) -> [String: Any] {
        func connectedDeviceDto(_ device: ConnectedDevice) -> [String: Any] {
            ["type": device.type, "pinNr": device.pinNr, "hwAddress": device.hwAddress]
        }
        var body: [String: Any] = [
            "type": source.type,
            "deviceId": source.deviceId,
            "name": source.name,
            "temperature": source.temperature,
            "heatActuator": connectedDeviceDto(source.heatActuator),
            "tempSensor": connectedDeviceDto(source.tempSensor),
            "heatingPeriod": source.heatingPeriod,
            "p": source.p,
            "i": source.i,
            "d": source.d,
            "archived": source.archived,
        ]
        if source.type == 1 {
            if let pump1 = source.pump1Actuator { body["pump1Actuator"] = connectedDeviceDto(pump1) }
            if let pump2 = source.pump2Actuator { body["pump2Actuator"] = connectedDeviceDto(pump2) }
            if let v = source.heaterPwm { body["heaterPwm"] = v }
            if let v = source.pump1Pwm { body["pump1Pwm"] = v }
            if let v = source.pump2Pwm { body["pump2Pwm"] = v }
        } else if source.type == 2 {
            if let cool = source.coolActuator { body["coolActuator"] = connectedDeviceDto(cool) }
            if let fan = source.fanActuator { body["fanActuator"] = connectedDeviceDto(fan) }
            if let v = source.fanPwm { body["fanPwm"] = v }
            body["coolingPeriod"] = source.coolingPeriod ?? 0
            body["coolingOnTime"] = source.coolingOnTime ?? 0
            body["coolingOffTime"] = source.coolingOffTime ?? 0
        }
        return body
    }
    
    private static let responseJSONDecoder: JSONDecoder = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateStr = try container.decode(String.self)
            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX"
            if let date = formatter.date(from: dateStr) { return date }
            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssXXXXX"
            if let date = formatter.date(from: dateStr) { return date }
            throw DateError.invalidDate
        }
        return decoder
    }()

    func getDevices() async throws -> [Device] {
        guard let url = URL(string: "\(preferences.correctedApiUrl())/devices") else {
            throw APIError.invalidUrl
        }
        return try await performAuthenticatedRequest(
            buildingRequest: { token in
                var request = URLRequest(url: url)
                request.httpMethod = "GET"
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                return request
            },
            parseResponse: { data, _ in
                do {
                    return try Self.responseJSONDecoder.decode([Device].self, from: data)
                } catch {
                    throw APIError.decodingError
                }
            }
        )
    }

    func updateDevice(id: String, name: String, notes: String? = nil) async throws {
        guard let url = URL(string: "\(preferences.correctedApiUrl())/devices/\(id)") else {
            throw APIError.invalidUrl
        }
        let body: [String: String]
        if let notes = notes {
            body = ["name": name, "notes": notes]
        } else {
            body = ["name": name]
        }
        let _: Void = try await performAuthenticatedRequest(
            buildingRequest: { token in
                var request = URLRequest(url: url)
                request.httpMethod = "PUT"
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = try? JSONEncoder().encode(body)
                return request
            },
            parseResponse: { _, _ in () }
        )
    }
}
