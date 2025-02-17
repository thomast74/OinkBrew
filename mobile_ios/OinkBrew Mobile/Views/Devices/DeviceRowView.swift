import SwiftUI

struct DeviceRowView: View {
    var device: Device
    var isSelected: Bool
    
    var body: some View {
        HStack {
            Rectangle()
                .fill(isSelected ? .orange : .white.opacity(0.0))
                .frame(width: 5)
            Image("devices")
                .resizable()
                .renderingMode(.template)
                .frame(width: 40, height: 40)
                .padding(.trailing, 8)
                .foregroundColor(isSelected ? .black : .gray)
            Text(device.name ?? device.id).foregroundColor(isSelected ? .black : .gray)
            Spacer()
        }.frame(height: 44)
    }
}

#Preview {
    Group {
        DeviceRowView(device: devices[0], isSelected: true)
        DeviceRowView(device: devices[1], isSelected: false)
    }
}
