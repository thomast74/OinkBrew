import SwiftUI

struct Modal<Content: View>: View {
    @Binding var showModal: Bool
    let content: Content

    @State private var scrollViewContentSize: CGSize = .zero

    var body: some View {
        if showModal {
            ZStack {
                BackgroundStartUpView()
                ZStack {
                    Rectangle()
                        .fill(Color.black)
                        .opacity(0.4)
                        .cornerRadius(25)
                    
                    ScrollView {
                        content.background(
                            GeometryReader { geo -> Color in
                                DispatchQueue.main.async {
                                    print(geo.size)
                                    scrollViewContentSize = geo.size
                                }
                                return Color.clear
                            }
                        )
                    }
                }
                .frame(maxWidth: scrollViewContentSize.width, maxHeight: scrollViewContentSize.height)
            }
        }
    }
}
