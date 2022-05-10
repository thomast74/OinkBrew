import XCTest

extension XCUIApplication {
    func setApiUrl(_ apiUrl: String) {
        launchArguments += ["-PREF_API_URL", apiUrl]
    }
}
