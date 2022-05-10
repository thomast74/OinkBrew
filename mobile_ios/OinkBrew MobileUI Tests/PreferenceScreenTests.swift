import XCTest

class PreferenceScreenTests: XCTestCase {
    var app: XCUIApplication!
    
    func setup(apiUrl: String) {
        app = XCUIApplication()
        app.setApiUrl(apiUrl)
        app.launch()
    }

    override func tearDownWithError() throws {
    }

    func testSaveWithValidUrl() throws {
        setup(apiUrl: "")
        app.textFields["API Url"].tap()
        app.textFields["API Url"].typeText("http://localhost:4100")
        
        app.buttons["Save"].tap()
        
        XCTAssertFalse(app.staticTexts["Preferences"].exists, "Did not change screen")
    }
    
    func testSaveWithInvalidUrl() throws {
        setup(apiUrl: "")
        app.textFields["API Url"].tap()
        app.textFields["API Url"].typeText("Faulty Url")
        
        app.buttons["Save"].tap()
        
        XCTAssertTrue(app.staticTexts["Invalid Url entered"].exists, "Did not show invalid url error")
    }
    
    func testSaveWithEmptyUrl() throws {
        setup(apiUrl: "")
        
        app.buttons["Save"].tap()
        
        XCTAssertTrue(app.staticTexts["Invalid Url entered"].exists, "Did not show invalid url error")
    }
}
