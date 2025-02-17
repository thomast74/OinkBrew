import SwiftUI

struct InputPropertyRow: View {
    let label: String
    @Binding var value: String // Use @Binding for two-way data flow
    
    var onValueChange: ((String) -> Void)? = nil

    var body: some View {
        HStack {
            Text(label)
                .font(.headline)
            Spacer()
            TextField("Enter \(label)", text: $value)
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.trailing)
                .keyboardType(.default)
                .autocorrectionDisabled()
                .onChange(of: value, { oldValue, newValue in
                    onValueChange?(newValue)
                    print("Value for \(label) changed to: \(newValue)")
                })
        }
    }
}
