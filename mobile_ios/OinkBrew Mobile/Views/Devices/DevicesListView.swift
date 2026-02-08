import SwiftUI

struct DevicesListView: View {
    @EnvironmentObject var vm: DevicesViewModel
    @Binding var presentSideMenu: Bool

    @State private var selectedDevice: Device?

    var body: some View {
        VStack{
            ZStack {
                HStack{
                    Button{
                        presentSideMenu.toggle()
                    } label: {
                        Image("menu")
                            .resizable()
                            .frame(width: 32, height: 32)
                    }
                    Spacer()
                }
                .padding(.horizontal)
                
                Text("Devices")
                    .font(.headline)
            }
            NavigationSplitView {
                List(vm.devices, selection: $selectedDevice) { device in
                    NavigationLink(value: device) {
                        DeviceRowView(device: device, isSelected: device.id == selectedDevice?.id)
                    }
                    .background(
                        LinearGradient(colors: [device.id == selectedDevice?.id ? .orange.opacity(0.5) : .white.opacity(0.0), .white.opacity(0.0)], startPoint: .leading, endPoint: .trailing)
                    )
                    .listRowSeparator(.hidden)
                }
                .listStyle(.plain)
                .tint(.white.opacity(0.0))
                .overlay {
                    if vm.devices.count == 0 {
                        ContentUnavailableView {
                            Label("No devices found", systemImage: "doc.richtext.fill")
                        } description: {
                            Text("Connect a BrewPi to your Particle.io account for it to show up")
                        }
                    }
                }
 
            }             detail: {
                if let selected = selectedDevice {
                    let device = vm.devices.first(where: { $0.id == selected.id }) ?? selected
                    DeviceDetailView(device: device)
                } else {
                    Text("Please select a device from list")
                }
            }
            .onAppear {
                Task {
                    await vm.loadDevices()
                    if selectedDevice == nil && vm.devices.count > 0{
                        selectedDevice = vm.devices.first
                    }
                }
            }
        }
    }
}
