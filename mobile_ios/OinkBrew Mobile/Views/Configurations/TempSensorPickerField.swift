import SwiftUI

struct TempSensorPickerField: View {
    @Binding var selection: ConnectedDevice?
    let sensors: [ConnectedDevice]
    let labelWidth: CGFloat

    var body: some View {
        HStack {
            Text("Temp Sensor")
                .frame(width: labelWidth, alignment: .leading)
                .font(.headline)
            Spacer()
            Picker("Temp Sensor", selection: $selection) {
                Text("Temp Sensor").tag(nil as ConnectedDevice?)
                ForEach(sensors, id: \.id) { sensor in
                    Text(sensor.name ?? sensor.hwAddress)
                        .tag(sensor as ConnectedDevice?)
                }
            }
            .labelsHidden()
            .pickerStyle(.menu)
        }
    }
}
