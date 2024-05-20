import XCTest

class LoginScreenTests: XCTestCase {
    var app: XCUIApplication!
    
    func setupPreferences(apiUrl: String) {
        app = XCUIApplication()
        app.setApiUrl(apiUrl)
        app.launch()
    }
    
    override func tearDownWithError() throws {
    }

    func testLoginWithWrongUsername() throws {
        setup(apiUrl: "http://localhost:4100")
        app.textFields["API Url"].tap()
        app.textFields["API Url"].typeText("http://localhost:4100")

        
    }
}
