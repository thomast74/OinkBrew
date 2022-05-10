import SwiftUI

struct RoundedBorderLightTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .textFieldStyle(RoundedBorderTextFieldStyle())
            .colorScheme(.light)
    }
}
