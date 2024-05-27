import XCTest

extension XCUIApplication {
    func setApiUrl(_ apiUrl: String) {
        launchArguments += ["-PREF_API_URL", apiUrl]
    }
    
    func dismissKeyboardIfPresent() {
        if keyboards.element(boundBy: 0).exists {
            if UIDevice.current.userInterfaceIdiom == .pad {
                keyboards.buttons["Hide keyboard"].tap()
            } else {
                toolbars.buttons["Done"].tap()
            }
        }
    }
}

