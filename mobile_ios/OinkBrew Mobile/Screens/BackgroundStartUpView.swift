import SwiftUI

struct BackgroundStartUpView: View {
    var body: some View {
        GeometryReader { geometry in
            Image("background_startup")
                .resizable()
                .scaledToFill()
                .edgesIgnoringSafeArea(.all)
                .frame(width: geometry.frame(in: .global).width, height: geometry.frame(in: .global).height)
        }
    }
}
