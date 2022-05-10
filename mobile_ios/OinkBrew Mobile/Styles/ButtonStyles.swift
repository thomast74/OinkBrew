import SwiftUI

struct ActionButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(.white)
            .font(Font.body.bold())
            .padding(10)
            .padding(.horizontal, 20)
            .background(Color.white.opacity(
                            configuration.isPressed ? 0.5 : 0
                        ))
            .overlay(
                RoundedRectangle(cornerRadius: 25)
                                .stroke(Color.white, lineWidth: 6)
            )
            .cornerRadius(25)
    }
}
