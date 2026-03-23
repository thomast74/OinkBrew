import SwiftUI

struct ActuatorPickerField: View {
    let title: String
    @Binding var selection: ConnectedDevice?
    let options: [ConnectedDevice]
    let labelWidth: CGFloat

    var body: some View {
        HStack {
            Text(title)
                .frame(width: labelWidth, alignment: .leading)
                .font(.headline)
            Spacer()
            Picker(title, selection: $selection) {
                Text("Select").tag(nil as ConnectedDevice?)
                ForEach(options, id: \.id) { device in
                    Text(device.name ?? "Pin \(device.pinNr)")
                        .tag(device as ConnectedDevice?)
                }
            }
            .labelsHidden()
            .pickerStyle(.menu)
        }
    }
}
