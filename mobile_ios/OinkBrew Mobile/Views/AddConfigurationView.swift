import SwiftUI

struct AddConfigurationView: View {
    var dismiss: () -> Void
    
    var body: some View {
        VStack(spacing: 10) {
            Text("Add a new configuration")
                .font(.title)
                .foregroundColor(Color.white)
            
            HStack {
                Spacer()
                Button("Cancel") {
                    dismiss()
                }.buttonStyle(ActionButtonStyle())
                Spacer()
                Button("Confirm") {
                    dismiss()
                }.buttonStyle(ActionButtonStyle())
                Spacer()
            }
        }
        .frame(width: 300, height: 400, alignment: .topTrailing)
        .padding(.all, 32)
    }
}

#Preview {
    AddConfigurationView(dismiss: {})
}
