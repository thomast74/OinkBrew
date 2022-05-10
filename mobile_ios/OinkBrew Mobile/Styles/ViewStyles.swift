import SwiftUI


extension View {
    func withProportionAndCenter(_ geometry: GeometryProxy, _ proportion: CGFloat) -> some View {
        self.frame(width: getProportionedWidth(geometry, proportion), height: getProportionedWidth(geometry, proportion))
            .position(x: geometry.frame(in: .global).width/2, y: geometry.frame(in: .global).height/2)
    }
    
    private func getProportionedWidth(_ geometry: GeometryProxy, _ proportion: CGFloat) -> CGFloat {
        let width = geometry.frame(in: .global).width
        let height = geometry.frame(in: .global).height
        let maxSize = height > width ? width : height;
        
        return maxSize*proportion
    }
}
