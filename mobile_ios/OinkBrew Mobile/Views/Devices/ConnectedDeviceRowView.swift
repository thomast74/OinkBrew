import SwiftUI

struct ConnectedDeviceRowView: View {
    @EnvironmentObject private var vm: DevicesViewModel

    let deviceId: String
    let connectedDevice: ConnectedDevice

    @State private var name: String
    @State private var lastCommittedName: String
    @State private var debounceTask: Task<Void, Never>?
    @State private var isSaving = false

    init(deviceId: String, connectedDevice: ConnectedDevice) {
        self.deviceId = deviceId
        self.connectedDevice = connectedDevice
        _name = State(initialValue: connectedDevice.name ?? "")
        _lastCommittedName = State(initialValue: connectedDevice.name ?? "")
    }

    private func scheduleDebouncedSave() {
        debounceTask?.cancel()
        debounceTask = Task {
            try? await Task.sleep(nanoseconds: 1_200_000_000)
            guard !Task.isCancelled else { return }
            await MainActor.run {
                let nameToSave = name.trimmingCharacters(in: .whitespacesAndNewlines)
                if nameToSave.isEmpty || nameToSave == lastCommittedName { return }

                isSaving = true
                let offset = connectedDevice.offset ?? 0
                Task {
                    do {
                        try await vm.saveConnectedDevice(deviceId: deviceId, pinNr: connectedDevice.pinNr, hwAddress: connectedDevice.hwAddress, name: nameToSave, offset: offset)
                        await MainActor.run {
                            lastCommittedName = nameToSave
                            isSaving = false
                        }
                    } catch {
                        await MainActor.run {
                            print("Error saving")
                            name = lastCommittedName
                            isSaving = false
                        }
                    }
                }
            }
        }
    }

    private var addressText: String {
        switch connectedDevice.deviceType {
        case .oneWireTemp:
            return connectedDevice.hwAddress
        default:
            return "Pin \(connectedDevice.pinNr)"
        }
    }

    private func formatCelsius(_ value: Double?) -> String {
        String(format: "%.1f °C", value ?? 0)
    }

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: connectedDevice.deviceType.sfSymbolName)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .frame(width: 32, alignment: .center)

            HStack(spacing: 4) {
                TextField("Name", text: $name)
                    .font(.subheadline)
                    .lineLimit(1)
                    .onChange(of: name) { _, _ in scheduleDebouncedSave() }
                if isSaving {
                    ProgressView()
                        .scaleEffect(0.7)
                }
            }
            .frame(width: 200, alignment: .leading)

            Text(addressText)
                .font(.caption)
                .lineLimit(1)
                .truncationMode(.middle)
                .frame(width: 140, alignment: .leading)

            Image(systemName: (connectedDevice.connected ?? false) ? "checkmark.circle.fill" : "xmark.circle")
                .font(.subheadline)
                .foregroundColor((connectedDevice.connected ?? false) ? .green : .secondary)
                .frame(width: 28, alignment: .center)

            Text(formatCelsius(connectedDevice.offset))
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 56, alignment: .trailing)

            Text(formatCelsius(connectedDevice.deviceOffset))
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 48, alignment: .trailing)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 2)
        .alignmentGuide(.listRowSeparatorLeading) { viewDimensions in
          0
        }
        .onChange(of: connectedDevice.name) { _, newValue in
            let updated = newValue ?? ""
            name = updated
            lastCommittedName = updated
        }
    }
}
