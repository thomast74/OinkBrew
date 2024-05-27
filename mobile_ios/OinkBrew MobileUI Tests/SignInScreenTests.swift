import XCTest
import SwiftOTP

class SignInScreenTests: XCTestCase {
    var app: XCUIApplication!
    
    func setup(apiUrl: String) {
        app = XCUIApplication()
        app.setApiUrl(apiUrl)
        app.launch()
    }
    
    override func tearDownWithError() throws {
    }

    func testLoginWithWrongApiBackend() throws {
        setup(apiUrl: "http://localhost:4200")
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("thomast74@gmail.com")
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("wrong password")
        app.dismissKeyboardIfPresent()
        
        app.buttons["Sign In"].tap()

        XCTAssertTrue(app.staticTexts["API Error"].exists, "Did not report login error")
    }
    
    func testLoginWithWrongUsername() throws {
        setup(apiUrl: "http://localhost:3000")
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("thomast74@gmail.com")
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("wrong password")
        app.dismissKeyboardIfPresent()
        
        app.buttons["Sign In"].tap()

        XCTAssertTrue(app.staticTexts["Username or password wrong"].exists, "Did not report login error")
    }
    
    func testLoginWithWrongPassword() throws {
        setup(apiUrl: "http://localhost:3000")
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("admin")
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("wrong password")
        app.dismissKeyboardIfPresent()
        
        app.buttons["Sign In"].tap()

        XCTAssertTrue(app.staticTexts["Username or password wrong"].exists, "Did not report login error")
    }
    
    func testLoginWithCorrectUserAndPassword() throws {
        setup(apiUrl: "http://localhost:3000")
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("admin")
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("admin")
        app.dismissKeyboardIfPresent()
        
        app.buttons["Sign In"].tap()

        XCTAssertTrue(app.staticTexts["Confirm OTP"].exists, "Did not go to confirm otp screen")
    }
    
    func testLoginWithWrongOtpToken() throws {
        setup(apiUrl: "http://localhost:3000")
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("admin")
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("admin")
        app.dismissKeyboardIfPresent()
        
        app.buttons["Sign In"].tap()

        app.textFields["Cornfirm OTP"].tap()
        app.textFields["Cornfirm OTP"].typeText("123456")
        app.dismissKeyboardIfPresent()

        app.buttons["Confirm"].tap()
        
        XCTAssertTrue(app.staticTexts["OTP is not correct"].exists, "Did not get correct OTP error")
    }
    
    func testLoginWithCorrectOtpToken() throws {
        setup(apiUrl: "http://localhost:3000")
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("admin")
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("admin")
        app.dismissKeyboardIfPresent()
        
        app.buttons["Sign In"].tap()

        let secret = base32DecodeToData("JRQFAAKEBYREU2T6")!
        let totp = TOTP(secret: secret)
        let otpToken = totp!.generate(time: Date.now)!
        
        app.textFields["Cornfirm OTP"].tap()
        app.textFields["Cornfirm OTP"].typeText(otpToken)
        app.dismissKeyboardIfPresent()

        app.buttons["Confirm"].tap()
        
        XCTAssertTrue(app.staticTexts["Home"].exists, "Did not route to home screen")
    }
}
