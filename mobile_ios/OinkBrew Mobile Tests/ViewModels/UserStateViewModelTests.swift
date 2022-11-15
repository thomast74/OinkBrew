import XCTest
import Mocker
@testable import OinkBrew_Mobile

@MainActor
class UserStateViewModelTests: XCTestCase {
    private var urlSession: URLSession!
    private let apiUrl = "https://localhost:4200"

    override func setUp() {
        super.setUp()
        Mocker.mode = .optin
        
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [MockingURLProtocol.self]
        urlSession = URLSession(configuration: configuration)
    }
    
    override func tearDown() {
        Mocker.removeAll()
        super.tearDown()
    }
    
    func prepare(with signupTokens: SignUpTokensDto? = nil) -> UserStateViewModel {
        Preferences.shared.apiUrl = apiUrl

        return UserStateViewModel(urlSession: urlSession, signupTokens: signupTokens)
    }
    
    func testSignUpShouldSendDataToApiUrl() async throws {
        let onRequestExpectation = self.expectation(description: "Data request data as expected")
        let originalURL = URL(string: "\(apiUrl)/auth/signup")!
        let email = "t@t.de"
        let password = "12345"
        let expectedBody: [String: String] = ["email": email, "password": password]
        
        var mock = Mock(url: originalURL, dataType: .json, statusCode: 200, data: [
            .post : Data()
        ])
        mock.onRequest = { request, postBodyArguments in
            XCTAssertEqual(request.url, mock.request.url)
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.allHTTPHeaderFields?["Content-Type"], "application/json")
            XCTAssertEqual(expectedBody, postBodyArguments as? [String: String])
            
            onRequestExpectation.fulfill()
        }
        mock.register()
        
        let testSubject = prepare()
    
        let _ = await testSubject.signUp(email: email, password: password)
        
        waitForExpectations(timeout: 10.0, handler: nil)
    }
    
    func testSignUpShouldReturnErrorIfHttpRequestFails() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signup")!
        Mock(url: originalURL, dataType: .json, statusCode: 400, data: [
            .post : Data()
        ]).register()
        
        let testSubject = prepare()
    
        let result = await testSubject.signUp(email: "t@t.de", password: "12345")
        
        XCTAssertFalse(testSubject.isBusy)
        XCTAssertThrowsError(try result.get()) { error in
            XCTAssertEqual(error as! UserStateError, .signUpCreateUser)
        }
    }
    
    func testSignUpShouldReturnBarcodeAndUrl() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signup")!
        Mock(url: originalURL, dataType: .json, statusCode: 200, data: [
            .post : try! Data(contentsOf: MockedData.signUpResponse)
        ]).register()
        
        let testSubject = prepare()
    
        let result = await testSubject.signUp(email: "t@t.de", password: "12345")
        let tokens = try result.get();
        
        XCTAssertFalse(testSubject.isBusy)
        XCTAssertEqual(tokens.otp_token, "AAAAAA")
        XCTAssertEqual(tokens.otp_url, "BBBBBB")
        XCTAssertEqual(tokens.otp_barcode, "FFFFFF")
        XCTAssertEqual(tokens.user_id, 32)
    }
    
    func testSignUpOtpShouldSendDataToApiUrl() async throws {
        let onRequestExpectation = self.expectation(description: "Data request data as expected")
        let originalURL = URL(string: "\(apiUrl)/auth/signupOtp")!
        let userId = 32
        let otpPassword = "123456"
        let otpToken = "AAAAAA"
        let expectedBody: [String: Any] = ["userId": userId, "otpPassword": otpPassword]
        let data = try? JSONSerialization.data(withJSONObject: ["user_id": userId, "otp_token": otpToken, "otp_url": "", "otp_barcode": ""], options: [])
        let signupTokens = try JSONDecoder().decode(SignUpTokensDto.self, from: data!)
        
        var mock = Mock(url: originalURL, dataType: .json, statusCode: 200, data: [
            .post : Data()
        ])
        mock.onRequest = { request, postBodyArguments in
            XCTAssertEqual(request.url, mock.request.url)
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.allHTTPHeaderFields?["Authorization"], "Bearer \(otpToken)")
            XCTAssertEqual(request.allHTTPHeaderFields?["Content-Type"], "application/json")
            XCTAssertEqual(expectedBody["userId"] as? Int, postBodyArguments?["userId"] as? Int)
            XCTAssertEqual(expectedBody["otpPassword"] as? String, postBodyArguments?["otpPassword"] as? String)

            onRequestExpectation.fulfill()
        }
        mock.register()
        
        let testSubject = prepare(with: signupTokens)
    
        let _ = await testSubject.signUpOtp(otp: "123456")
        
        waitForExpectations(timeout: 10.0, handler: nil)
    }
    
    func testSignUpOtpShouldReturnErrorIfNoSignUpTokens() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signupOtp")!
        Mock(url: originalURL, dataType: .json, statusCode: 400, data: [
            .post : Data()
        ]).register()
        
        let testSubject = prepare()
    
        let result = await testSubject.signUpOtp(otp: "123456")
        
        XCTAssertFalse(testSubject.isBusy)
        XCTAssertThrowsError(try result.get()) { error in
            XCTAssertEqual(error as! UserStateError, .signUpNoToken)
        }
    }
    
    func testSignUpOtpShouldReturnErrorIfHttpErrorReturns() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signupOtp")!
        let data = try? JSONSerialization.data(withJSONObject: ["user_id": 32, "otp_token": "AAAAA", "otp_url": "", "otp_barcode": ""], options: [])
        let signupTokens = try JSONDecoder().decode(SignUpTokensDto.self, from: data!)

        Mock(url: originalURL, dataType: .json, statusCode: 400, data: [
            .post : Data()
        ]).register()
        
        let testSubject = prepare(with: signupTokens)
    
        let result = await testSubject.signUpOtp(otp: "123456")
        
        XCTAssertFalse(testSubject.isBusy)
        XCTAssertThrowsError(try result.get()) { error in
            XCTAssertEqual(error as! UserStateError, .signUpConfirmToken)
        }
    }
    
    func testSignUpOtpShouldReturnAccessToken() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signupOtp")!
        let data = try? JSONSerialization.data(withJSONObject: ["user_id": 32, "otp_token": "AAAAA", "otp_url": "", "otp_barcode": ""], options: [])
        let signupTokens = try JSONDecoder().decode(SignUpTokensDto.self, from: data!)
        Mock(url: originalURL, dataType: .json, statusCode: 200, data: [
            .post : try! Data(contentsOf: MockedData.signUpOtpResponse)
        ]).register()
        
        let testSubject = prepare(with: signupTokens)
    
        let result = await testSubject.signUpOtp(otp: "123456")
        let success = try result.get();
        
        XCTAssertTrue(success)
        XCTAssertTrue(testSubject.isSignedIn)
        XCTAssertFalse(testSubject.needsSignUp)
        XCTAssertFalse(testSubject.isBusy)
        XCTAssertEqual(testSubject.accessTokens?.access_token, "AAAAAA")
        XCTAssertEqual(testSubject.accessTokens?.refresh_token, "BBBBBB")
    }
}
