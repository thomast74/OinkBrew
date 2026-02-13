import SwiftUI

struct DeviceDetailView: View {
    @EnvironmentObject private var vm: DevicesViewModel
    @State private var deviceName: String
    @State private var lastCommittedName: String
    @State private var deviceNotes: String
    @State private var lastCommittedNotes: String
    @State private var debounceTask: Task<Void, Never>?
    @State private var toastMessage: String?
    @State private var isUpdatingName: Bool = false
    @State private var isUpdatingNotes: Bool = false

    private let device: Device
    private let isoFormatter: ISO8601DateFormatter

    init(device: Device) {
        self.device = device
        let name = device.name ?? ""
        let notes = device.notes ?? ""
        _deviceName = State(initialValue: name)
        _lastCommittedName = State(initialValue: name)
        _deviceNotes = State(initialValue: notes)
        _lastCommittedNotes = State(initialValue: notes)
        isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withFullDate, .withDashSeparatorInDate, .withTime, .withSpaceBetweenDateAndTime, .withColonSeparatorInTime]
    }

    /// Live device from ViewModel so the Form (and Connected Devices section) reflects updates without refetch.
    private var displayedDevice: Device {
        vm.devices.first(where: { $0.id == device.id }) ?? device
    }

    private func scheduleDebouncedSave() {
        debounceTask?.cancel()
        debounceTask = Task {
            try? await Task.sleep(nanoseconds: 1_200_000_000)
            guard !Task.isCancelled else { return }
            await MainActor.run {
                let nameToSave = deviceName.trimmingCharacters(in: .whitespacesAndNewlines)
                let notesToSave = deviceNotes.trimmingCharacters(in: .whitespacesAndNewlines)
                let nameUnchanged = nameToSave == lastCommittedName
                let notesUnchanged = notesToSave == lastCommittedNotes
                
                if nameToSave.isEmpty || (nameUnchanged && notesUnchanged) {
                    return
                }
                
                if !nameUnchanged { isUpdatingName = true }
                if !notesUnchanged { isUpdatingNotes = true }
                
                Task {
                    do {
                        try await vm.saveDevice(id: device.id, name: nameToSave, notes: notesToSave.isEmpty ? nil : notesToSave)
                        await MainActor.run {
                            lastCommittedName = nameToSave
                            lastCommittedNotes = notesToSave
                            isUpdatingName = false
                            isUpdatingNotes = false;
                        }
                    } catch APIError.serverMessage(let msg) {
                        await MainActor.run {
                            deviceName = lastCommittedName
                            deviceNotes = lastCommittedNotes
                            toastMessage = msg
                            isUpdatingName = false
                            isUpdatingNotes = false;
                        }
                    } catch {
                        await MainActor.run {
                            deviceName = lastCommittedName
                            deviceNotes = lastCommittedNotes
                            toastMessage = "Update failed"
                            isUpdatingName = false
                            isUpdatingNotes = false;
                        }
                    }
                }
            }
        }
    }

    var body: some View {
        Form {
            Section(header: Text("Basic Information")) {
                HStack {
                    InputPropertyRow(label: "Name", value: $deviceName) { _ in
                        scheduleDebouncedSave()
                    }
                    if isUpdatingName {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                }
                PropertyRow(label: "Serial Number", value: displayedDevice.serial_number)
                PropertyRow(label: "Shield Version", value: displayedDevice.shieldVersion?.description ?? "")
                PropertyRow(label: "Firmware", value: displayedDevice.firmwareVersion?.description ?? "")
                PropertyRow(label: "System Firmware", value: displayedDevice.system_firmware_version)
            }

            Section(header: Text("Status & Notes")) {
                PropertyRow(label: "Online", value: displayedDevice.online ? "Yes" : "No")
                PropertyRow(label: "Connected", value: displayedDevice.connected ? "Yes" : "No")
                PropertyRow(label: "Status", value: displayedDevice.status)
                HStack {
                    InputPropertyRow(label: "Notes", value: $deviceNotes) { _ in
                        scheduleDebouncedSave()
                    }
                    if isUpdatingNotes {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                }
            }

            Section(header: Text("Connected Devices")) {
                if displayedDevice.connectedDevices.isEmpty {
                    Text("No connected devices")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                } else {
                    HStack(spacing: 8) {
                        Text("Type")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .frame(width: 32, alignment: .leading)
                        Text("Name")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .frame(width: 200, alignment: .leading)
                        Text("Address")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .frame(width: 140, alignment: .leading)
                        Text("Con.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .frame(width: 28, alignment: .center)
                        Text("Offset")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .frame(width: 56, alignment: .trailing)
                        Text("Dev°")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .frame(width: 48, alignment: .trailing)
                    }
                    .padding(.vertical, 2)

                    ForEach(displayedDevice.connectedDevices) { connectedDevice in
                        ConnectedDeviceRowView(deviceId: displayedDevice.id, connectedDevice: connectedDevice)
                    }
                }
            }

            Section(header: Text("Timestamps")) {
                PropertyRow(label: "Created At", value: isoFormatter.string(from: displayedDevice.createdAt))
                PropertyRow(label: "Updated At", value: isoFormatter.string(from: displayedDevice.updatedAt))
                PropertyRow(label: "Last Heard", value: isoFormatter.string(from: displayedDevice.last_heard))
                PropertyRow(label: "Last Handshake", value: isoFormatter.string(from: displayedDevice.last_handshake_at))
            }
        }
        .navigationTitle(deviceName.isEmpty ? device.id : deviceName)
        .overlay(alignment: .bottom) {
            if let message = toastMessage {
                ToastBanner(message: message)
                    .padding(.bottom, 48)
                    .onTapGesture {
                        toastMessage = nil
                    }
            }
        }
        .onChange(of: toastMessage) { _, newValue in
            if newValue != nil {
                Task { @MainActor in
                    try? await Task.sleep(nanoseconds: 4_000_000_000)
                    toastMessage = nil
                }
            }
        }
        .onChange(of: device.id) { _, _ in
            let name = device.name ?? ""
            let notes = device.notes ?? ""
            debounceTask?.cancel()
            deviceName = name
            lastCommittedName = name
            deviceNotes = notes
            lastCommittedNotes = notes
            toastMessage = nil
            isUpdatingName = false
            isUpdatingNotes = false
        }
    }
}

private struct ToastBanner: View {
    let message: String

    var body: some View {
        Text(message)
            .font(.subheadline)
            .foregroundColor(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(Color.red.opacity(0.9))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .padding(.horizontal, 24)
    }
}

#Preview {
    DeviceDetailView(device: devices[0])
        .environmentObject(DevicesViewModel())
}
