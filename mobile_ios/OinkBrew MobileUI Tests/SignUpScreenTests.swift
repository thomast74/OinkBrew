import XCTest
import Mocker
import SwiftOTP
import Fakery

class SignUpScreenTests: XCTestCase {
    var app: XCUIApplication!
    let faker = Faker()
    
    func setup(apiUrl: String) {
        app = XCUIApplication()
        app.setApiUrl(apiUrl)
        app.launch()
        
        app.buttons["No Account yet? Sign Up"].tap()
    }
    
    override func tearDownWithError() throws {
    }
    
    func testSignUpWithWrongApiBackend() throws {
        setup(apiUrl: "http://localhost:4200")
        
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("thomast74@gmail.com")
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("wrong password")
        app.dismissKeyboardIfPresent()
        
        app.buttons["Create"].tap()

        XCTAssertTrue(app.staticTexts["API Error"].exists, "Did not report signup error")
    }
    
    func testSignUpWithNoEmail() throws {
        setup(apiUrl: "http://localhost:3000")
        
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("")
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("mypassword")
        app.dismissKeyboardIfPresent()
        
        app.buttons["Create"].tap()

        XCTAssertTrue(app.staticTexts["You must provide an email"].exists, "Did not report signup error")
    }

    func testSignUpWithNoPassword() throws {
        setup(apiUrl: "http://localhost:3000")
        
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText(faker.internet.email())
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("")
        app.dismissKeyboardIfPresent()
        
        app.buttons["Create"].tap()

        XCTAssertTrue(app.staticTexts["You must provide a password"].exists, "Did not report signup error")
    }
    
    func testSignUpWithUsername() throws {
        setup(apiUrl: "http://localhost:3000")
        
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText(faker.name.lastName())
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText(faker.internet.password(minimumLength: 8, maximumLength: 12))
        app.dismissKeyboardIfPresent()
        
        app.buttons["Create"].tap()

        XCTAssertTrue(app.staticTexts["User could not be created"].exists, "Did not report signup error")
    }
    
    func testSignUpWithExistingUser() throws {
        setup(apiUrl: "http://localhost:3000")
        
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("thomast74@gmail.com")
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText(faker.internet.password(minimumLength: 8, maximumLength: 12))
        app.dismissKeyboardIfPresent()
        
        app.buttons["Create"].tap()

        XCTAssertTrue(app.staticTexts["User could not be created"].exists, "Did not report signup error")
    }
    
    func testSignUpWithUser() throws {
        setup(apiUrl: "http://localhost:3000")
        
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText(faker.internet.email())
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText(faker.internet.password(minimumLength: 8, maximumLength: 12))
        app.dismissKeyboardIfPresent()
        
        app.buttons["Create"].tap()

        XCTAssertTrue(app.staticTexts["Setup & Confirm OTP"].exists, "Did not report signup error")
    }
    
    func testSignUpConfirmWithWrongOtp() throws {
        setup(apiUrl: "http://localhost:3000")
        
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText(faker.internet.email())
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText(faker.internet.password(minimumLength: 8, maximumLength: 12))
        app.dismissKeyboardIfPresent()
        
        app.buttons["Create"].tap()

        app.textFields["Cornfirm OTP"].tap()
        app.textFields["Cornfirm OTP"].typeText(faker.number.randomInt(min: 100000, max: 999999).description)
        app.dismissKeyboardIfPresent()
        
        app.buttons["Confirm"].tap()
        
        XCTAssertTrue(app.staticTexts["OTP is not correct"].exists, "Did not report signup error")
    }
    
    func testSignUpConfirmWithCorrectOtp() throws {
        setup(apiUrl: "http://localhost:3000")
        
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText(faker.internet.email())
        app.dismissKeyboardIfPresent()
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText(faker.internet.password(minimumLength: 8, maximumLength: 12))
        app.dismissKeyboardIfPresent()
        
        app.buttons["Create"].tap()

        let secret = base32DecodeToData(app.staticTexts["Manual Secret"].label.replacingOccurrences(of: "Manual: ", with: ""))!
        let totp = TOTP(secret: secret)
        let otpToken = totp!.generate(time: Date.now)!

        app.textFields["Cornfirm OTP"].tap()
        app.textFields["Cornfirm OTP"].typeText(otpToken)
        app.dismissKeyboardIfPresent()

        app.buttons["Confirm"].tap()
        
        XCTAssertTrue(app.staticTexts["Home"].exists, "Did not route to home page")
    }
}
