import Foundation

@MainActor
class ConfigurationsViewModel: ObservableObject {
       
    @Published var configurations: [BeerConfiguration] = []
    @Published var errorMessage = ""
    @Published var hasError = false
    /// When false, show active only (default). When true, show archived only.
    @Published var showArchivedOnly: Bool = false

    // MARK: - Navigation guard state (set by ConfigurationSettingsView, read by ConfigurationsListView)
    @Published var detailHasUnsavedChanges = false
    /// Holds the updated configuration built from current edits, used by the navigation guard Save action.
    var pendingSaveConfiguration: BeerConfiguration?
    
    private var withMockData: Bool = false
    
    init(withMockData: Bool = false) {
        self.withMockData = withMockData
    }
    
    func loadConfigurations() async {
        if withMockData {
            loadMockData()
            return
        }

        guard let data = try? await APIService.shared.getConfigurations(archived: showArchivedOnly) else {
            self.configurations = []
            self.hasError = true
            self.errorMessage = "Server Error"
            return
        }
        
        self.configurations = data
    }
    
    private func loadMockData() {
        self.configurations = beerConfigurations.filter { $0.archived == showArchivedOnly }
    }
    
    /// Toggles between active and archived, then refetches configurations.
    func toggleArchiveFilter() async {
        showArchivedOnly.toggle()
        await loadConfigurations()
    }

    /// Sets the archived state of a configuration (archive or unarchive), then refetches the list.
    func setArchived(_ configuration: BeerConfiguration, archived: Bool) async {
        if withMockData {
            await loadConfigurations()
            return
        }
        do {
            if archived {
                try await APIService.shared.archiveConfiguration(id: configuration.id)
            } else {
                var unarchived = configuration
                unarchived.archived = false
                try await APIService.shared.updateConfiguration(unarchived)
            }
            await loadConfigurations()
        } catch {
            hasError = true
            errorMessage = (error as? APIError)?.localizedDescription ?? "Request failed"
        }
    }

    /// Updates an existing configuration via API, then refreshes the list.
    func updateConfiguration(_ configuration: BeerConfiguration) async {
        if withMockData {
            await loadConfigurations()
            return
        }
        do {
            try await APIService.shared.updateConfiguration(configuration)
            hasError = false
            errorMessage = ""
            await loadConfigurations()
        } catch {
            hasError = true
            errorMessage = (error as? APIError)?.localizedDescription ?? "Request failed"
        }
    }

    /// Creates a new configuration via API (or appends a mock and refreshes when using mock data).
    func createConfiguration(_ payload: CreateConfigurationPayload) async {
        if withMockData {
            appendMockConfiguration(from: payload)
            await loadConfigurations()
            return
        }
        do {
            _ = try await APIService.shared.createConfiguration(payload)
            hasError = false
            errorMessage = ""
            await loadConfigurations()
        } catch {
            hasError = true
            errorMessage = (error as? APIError)?.localizedDescription ?? "Request failed"
        }
    }

    /// Builds a placeholder device for mock configurations (used when appending from payload).
    private func placeholderDevice(deviceId: String) -> Device {
        let now = Date()
        return Device(
            _id: "",
            __v: 0,
            id: deviceId,
            createdAt: now,
            updatedAt: now,
            name: nil,
            last_ip_address: "",
            last_heard: now,
            last_handshake_at: now,
            product_id: 0,
            online: false,
            connected: false,
            platform_id: 0,
            cellular: false,
            notes: nil,
            firmware_updates_enabled: false,
            firmware_updates_forced: false,
            status: "",
            serial_number: "",
            system_firmware_version: "",
            current_build_target: "",
            pinned_build_target: nil,
            default_build_target: "",
            functions: [],
            variables: [:],
            connectedDevices: []
        )
    }

    /// Appends a mock configuration built from the payload to the global list (for mock mode).
    private func appendMockConfiguration(from payload: CreateConfigurationPayload) {
        let nextId = (beerConfigurations.map(\.id).max() ?? 0) + 1
        let now = Date()
        let device = placeholderDevice(deviceId: payload.deviceId)
        var config = BeerConfiguration(
            type: payload.type,
            id: nextId,
            createdAt: now,
            updatedAt: now,
            name: payload.name,
            archived: false,
            device: device,
            temperature: payload.temperature,
            heatActuator: payload.heatActuator,
            tempSensor: payload.tempSensor,
            pump1Actuator: payload.pump1Actuator,
            pump2Actuator: payload.pump2Actuator,
            heaterPwm: payload.heaterPwm,
            pump1Pwm: nil,
            pump2Pwm: nil,
            coolActuator: payload.coolActuator,
            fanActuator: payload.fanActuator,
            fanPwm: payload.fanPwm,
            coolingPeriod: payload.coolingPeriod,
            coolingOnTime: payload.coolingOnTime,
            coolingOffTime: payload.coolingOffTime,
            heatingPeriod: payload.heatingPeriod,
            p: payload.p,
            i: payload.i,
            d: payload.d
        )
        beerConfigurations.append(config)
    }
}
