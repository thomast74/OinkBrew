import SwiftUI

struct SettingsView: View {
    @Binding var presentSideMenu: Bool
    @EnvironmentObject var preference: PreferenceViewModel

    @State private var apiUrl = ""
    @State private var error = ""
    @State private var saveTask: Task<Void, Never>?

    private let debounceInterval: UInt64 = 666_000_000 // 666ms in nanoseconds

    var body: some View {
        VStack(spacing: 0) {
            ZStack {
                HStack {
                    Button {
                        presentSideMenu.toggle()
                    } label: {
                        Image("menu")
                            .resizable()
                            .frame(width: 32, height: 32)
                    }
                    Spacer()
                }
                .padding(.horizontal)

                Text("Settings")
                    .font(.headline)
            }
            .frame(height: 44)
            .padding(.bottom, 8)

            List {
                Section {
                    HStack {
                        Text("URL")
                        Spacer(minLength: 16)
                        TextField("https://api.example.com", text: $apiUrl)
                            .keyboardType(.URL)
                            .textContentType(.URL)
                            .disableAutocorrection(true)
                            .autocapitalization(.none)
                            .multilineTextAlignment(.trailing)
                            .accessibility(identifier: "API Url")
                    }
                } header: {
                    Text("API Server")
                } footer: {
                    if !error.isEmpty {
                        Text(error)
                            .foregroundColor(.red)
                            .accessibility(identifier: "Error")
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollDismissesKeyboard(.interactively)
        }
        .padding(.top, 8)
        .onAppear {
            apiUrl = preference.apiUrl
        }
        .onChange(of: apiUrl) { _, newValue in
            saveTask?.cancel()
            saveTask = Task {
                do {
                    try await Task.sleep(nanoseconds: debounceInterval)
                } catch {
                    return
                }
                guard !Task.isCancelled else { return }
                let valueToSave = newValue
                let result = await preference.save(apiUrl: valueToSave)
                guard !Task.isCancelled else { return }
                await MainActor.run {
                    switch result {
                    case .failure(.invalidUrl):
                        error = "Invalid Url entered"
                    case .failure(.saveError):
                        error = "Error while saving new Url"
                    case .success:
                        error = ""
                    }
                }
            }
        }
    }
}

#Preview {
    SettingsView(presentSideMenu: .constant(false))
        .environmentObject(PreferenceViewModel(userDefaults: UserDefaults.standard))
}
