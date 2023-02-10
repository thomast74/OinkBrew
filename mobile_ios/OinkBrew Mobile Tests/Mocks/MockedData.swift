import Foundation

public final class MockedData {
    public static let signUpResponse: URL = Bundle.module.url(forResource: "signUpGoodResponse", withExtension: "json")!
}

extension Bundle {
#if !SWIFT_PACKAGE
    static let module = Bundle(for: MockedData.self)
#endif
}

internal extension URL {
    /// Returns a `Data` representation of the current `URL`. Force unwrapping as it's only used for tests.
    var data: Data {
        return try! Data(contentsOf: self)
    }
}
