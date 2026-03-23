import SwiftUI

struct SliderField: View {
    let label: String
    let labelShort: String
    let labelWidth: CGFloat
    let min: Double
    let max: Double
    let step: Double

    private var doubleBinding: Binding<Double>
    private var isIntegerMode: Bool
    @Binding private var intValue: Int
    @Binding private var doubleValue: Double

    /// Integer value variant.
    init(label: String, labelShort: String, value: Binding<Int>, labelWidth: CGFloat, min: Int, max: Int, step: Int) {
        self.label = label
        self.labelShort = labelShort
        self.labelWidth = labelWidth
        self.min = Double(min)
        self.max = Double(max)
        self.step = Double(step)
        self.isIntegerMode = true
        self._intValue = value
        self._doubleValue = .constant(0)
        self.doubleBinding = Binding(
            get: { Double(value.wrappedValue) },
            set: { value.wrappedValue = Int($0) }
        )
    }

    /// Double value variant.
    init(label: String, labelShort: String, value: Binding<Double>, labelWidth: CGFloat, min: Double, max: Double, step: Double) {
        self.label = label
        self.labelShort = labelShort
        self.labelWidth = labelWidth
        self.min = min
        self.max = max
        self.step = step
        self.isIntegerMode = false
        self._intValue = .constant(0)
        self._doubleValue = value
        self.doubleBinding = value
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .frame(width: labelWidth, alignment: .leading)
                    .font(.headline)
                Spacer()
                Slider(
                    value: doubleBinding,
                    in: min ... max,
                    step: step
                )
                .frame(width: 250, alignment: .trailing)
                valueLabel
                    .font(.body)
                    .foregroundColor(.secondary)
                    .frame(minWidth: 96, alignment: .trailing)
                    .padding(.trailing, 16)
            }
        }
    }

    @ViewBuilder
    private var valueLabel: some View {
        if isIntegerMode {
            Text("\(intValue) \(labelShort)")
        } else {
            Text(String(format: "%.1f %@", doubleValue, labelShort))
        }
    }
}
