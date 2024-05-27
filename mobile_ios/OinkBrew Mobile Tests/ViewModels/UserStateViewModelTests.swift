import XCTest
import Mocker
@testable import OinkBrew_Mobile

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
    
    @MainActor
    func prepare(withSignUp signupTokens: SignUpTokensDto? = nil, withSignIn signinTokens: SignInTokensDto? = nil) -> UserStateViewModel {
        Preferences.shared.apiUrl = apiUrl

        return UserStateViewModel(
            urlSession: urlSession,
            signupTokens: signupTokens,
            signinTokens: signinTokens
        )
    }
    
    func testSignUpShouldSendDataToApiUrl() async throws {
        let onRequestExpectation = self.expectation(description: "Data request data as expected")
        let originalURL = URL(string: "\(apiUrl)/auth/signup")!
        let email = "t@t.de"
        let password = "12345"
        let expectedBody: [String: String] = ["email": email, "password": password]
        
        var mock = Mock(url: originalURL, contentType: .json, statusCode: 200, data: [
            .post : Data()
        ])
        mock.onRequestHandler = OnRequestHandler(jsonDictionaryCallback: { request, postBodyArguments in
            XCTAssertEqual(request.url, mock.request.url)
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.allHTTPHeaderFields?["Content-Type"], "application/json")
            XCTAssertEqual(postBodyArguments as? [String: String], expectedBody)
            
            onRequestExpectation.fulfill()
        })
        mock.register()
        
        let testSubject = await prepare()
    
        let _ = await testSubject.signUp(email: email, password: password)
        
        await fulfillment(of: [onRequestExpectation], timeout: 10.0)
    }
    
    func testSignUpShouldReturnErrorIfHttpRequestFails() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signup")!
        Mock(url: originalURL, contentType: .json, statusCode: 400, data: [
            .post : Data()
        ]).register()
        
        let testSubject = await prepare()
    
        let result = await testSubject.signUp(email: "t@t.de", password: "12345")
        let isBusy = await testSubject.isBusy
        
        XCTAssertFalse(isBusy)
        XCTAssertThrowsError(try result.get()) { error in
            XCTAssertEqual(error as! SignUpError, .signUpCreateUser)
        }
    }
    
    func testSignUpShouldReturnBarcodeAndUrl() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signup")!
        Mock(url: originalURL, contentType: .json, statusCode: 200, data: [
            .post : try! Data(contentsOf: MockedData.signUpResponse)
        ]).register()
        
        let testSubject = await prepare()
    
        let result = await testSubject.signUp(email: "t@t.de", password: "12345")
        let isBusy = await testSubject.isBusy
        let tokens = try result.get();
        
        XCTAssertFalse(isBusy)
        XCTAssertEqual(tokens.otpToken, "AAAAAA")
        XCTAssertEqual(tokens.otpUrl, "BBBBBB")
        XCTAssertEqual(tokens.otpBarcode, "FFFFFF")
        XCTAssertEqual(tokens.userId, "32")
    }
    
    func testSignUpOtpShouldSendDataToApiUrl() async throws {
        let onRequestExpectation = self.expectation(description: "Data request data as expected")
        let originalURL = URL(string: "\(apiUrl)/auth/signupOtp")!
        let userId = "32"
        let otpPassword = "123456"
        let otpToken = "AAAAAA"
        let expectedBody: [String: Any] = ["userId": userId, "otpPassword": otpPassword]
        let data = try? JSONSerialization.data(withJSONObject: ["userId": userId, "otpToken": otpToken, "otpUrl": "", "otpBarcode": ""], options: [])
        let signupTokens = try JSONDecoder().decode(SignUpTokensDto.self, from: data!)
        
        var mock = Mock(url: originalURL, contentType: .json, statusCode: 200, data: [
            .post : Data()
        ])
        mock.onRequestHandler = OnRequestHandler(jsonDictionaryCallback: { request, httpBodyArguments in
            XCTAssertEqual(request.url, mock.request.url)
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.allHTTPHeaderFields?["Authorization"], "Bearer \(otpToken)")
            XCTAssertEqual(request.allHTTPHeaderFields?["Content-Type"], "application/json")
            XCTAssertNotNil(httpBodyArguments)
            XCTAssertEqual(httpBodyArguments?["userId"] as? Int, expectedBody["userId"] as? Int)
            XCTAssertEqual(httpBodyArguments?["otpPassword"] as? String, expectedBody["otpPassword"] as? String)

            onRequestExpectation.fulfill()
        })
        mock.register()
        
        let testSubject = await prepare(withSignUp: signupTokens)
    
        let _ = await testSubject.signUpOtp(otp: "123456")
        
        await fulfillment(of:[onRequestExpectation], timeout: 10.0)
    }
    
    func testSignUpOtpShouldReturnErrorIfNoSignUpTokens() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signupOtp")!
        Mock(url: originalURL, contentType: .json, statusCode: 400, data: [
            .post : Data()
        ]).register()
        
        let testSubject = await prepare()
    
        let result = await testSubject.signUpOtp(otp: "123456")
        let isBusy = await testSubject.isBusy
        
        XCTAssertFalse(isBusy)
        XCTAssertThrowsError(try result.get()) { error in
            XCTAssertEqual(error as! SignUpError, .signUpNoToken)
        }
    }
    
    func testSignUpOtpShouldReturnErrorIfHttpErrorReturns() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signupOtp")!
        let data = try? JSONSerialization.data(withJSONObject: ["userId": "32", "otpToken": "AAAAA", "otpUrl": "", "otpBarcode": ""], options: [])
        let signupTokens = try JSONDecoder().decode(SignUpTokensDto.self, from: data!)

        Mock(url: originalURL, contentType: .json, statusCode: 400, data: [
            .post : Data()
        ]).register()
        
        let testSubject = await prepare(withSignUp: signupTokens)
    
        let result = await testSubject.signUpOtp(otp: "123456")
        let isBusy = await testSubject.isBusy
        
        XCTAssertFalse(isBusy)
        XCTAssertThrowsError(try result.get()) { error in
            XCTAssertEqual(error as! SignUpError, .signUpConfirmToken)
        }
    }
    
    func testSignUpOtpShouldReturnAccessToken() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signupOtp")!
        let data = try? JSONSerialization.data(withJSONObject: ["userId": "32", "otpToken": "AAAAA", "otpUrl": "", "otpBarcode": ""], options: [])
        let signupTokens = try JSONDecoder().decode(SignUpTokensDto.self, from: data!)
        Mock(url: originalURL, contentType: .json, statusCode: 200, data: [
            .post : try! Data(contentsOf: MockedData.signUpOtpResponse)
        ]).register()
        
        let testSubject = await prepare(withSignUp: signupTokens)
    
        let result = await testSubject.signUpOtp(otp: "123456")
        let isSignedIn = await testSubject.isSignedIn
        let needsSignUp = await testSubject.needsSignUp
        let isBusy = await testSubject.isBusy
        let accessTokens = await testSubject.accessTokens
        let success = try result.get();
        
        XCTAssertTrue(success)
        XCTAssertTrue(isSignedIn)
        XCTAssertFalse(needsSignUp)
        XCTAssertFalse(isBusy)
        XCTAssertEqual(accessTokens?.accessToken, "AAAAAA")
        XCTAssertEqual(accessTokens?.refreshToken, "BBBBBB")
    }
    
    func testSignInShouldSendDataToApiUrl() async throws {
        let onRequestExpectation = self.expectation(description: "Data request data as expected")
        let originalURL = URL(string: "\(apiUrl)/auth/signin")!
        let email = "t@t.de"
        let password = "12345"
        let expectedBody: [String: String] = ["email": email, "password": password]
        
        var mock = Mock(url: originalURL, contentType: .json, statusCode: 200, data: [
            .post : Data()
        ])
        mock.onRequestHandler = OnRequestHandler(jsonDictionaryCallback: { request, postBodyArguments in
            XCTAssertEqual(request.url, mock.request.url)
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.allHTTPHeaderFields?["Content-Type"], "application/json")
            XCTAssertEqual(postBodyArguments as? [String: String], expectedBody)
            
            onRequestExpectation.fulfill()
        })
        mock.register()
        
        let testSubject = await prepare()
    
        let _ = await testSubject.signIn(email: email, password: password)
        
        await fulfillment(of: [onRequestExpectation], timeout: 10.0)
    }
    
    func testSignInShouldReturnErrorIfHttpRequestFails() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signin")!
        Mock(url: originalURL, contentType: .json, statusCode: 400, data: [
            .post : Data()
        ]).register()
        
        let testSubject = await prepare()
    
        let result = await testSubject.signIn(email: "t@t.de", password: "12345")
        let isBusy = await testSubject.isBusy
        
        XCTAssertFalse(isBusy)
        XCTAssertThrowsError(try result.get()) { error in
            XCTAssertEqual(error as! SignInError, .signInLoginError)
        }
    }
    
    func testSignInShouldReturnTrue() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signin")!
        Mock(url: originalURL, contentType: .json, statusCode: 200, data: [
            .post : try! Data(contentsOf: MockedData.signUpResponse)
        ]).register()
            
        let testSubject = await prepare()
    
        let result = await testSubject.signIn(email: "t@t.de", password: "12345")
        let isBusy = await testSubject.isBusy
        let status = try result.get();
        
        XCTAssertFalse(isBusy)
        XCTAssertTrue(status)
    }
    
    func testSignInOtpShouldSendDataToApiUrl() async throws {
        let onRequestExpectation = self.expectation(description: "Data request data as expected")
        let originalURL = URL(string: "\(apiUrl)/auth/signinOtp")!
        let userId = "32"
        let otpPassword = "123456"
        let otpToken = "AAAAAA"
        let expectedBody: [String: Any] = ["userId": userId, "otpPassword": otpPassword]
        let data = try? JSONSerialization.data(withJSONObject: ["userId": userId, "otpToken": otpToken, "otpUrl": "", "otpBarcode": ""], options: [])
        let signinTokens = try JSONDecoder().decode(SignInTokensDto.self, from: data!)
        
        var mock = Mock(url: originalURL, contentType: .json, statusCode: 200, data: [
            .post : Data()
        ])
        mock.onRequestHandler = OnRequestHandler(jsonDictionaryCallback: { request, httpBodyArguments in
            XCTAssertEqual(request.url, mock.request.url)
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.allHTTPHeaderFields?["Authorization"], "Bearer \(otpToken)")
            XCTAssertEqual(request.allHTTPHeaderFields?["Content-Type"], "application/json")
            XCTAssertNotNil(httpBodyArguments)
            XCTAssertEqual(httpBodyArguments?["userId"] as? Int, expectedBody["userId"] as? Int)
            XCTAssertEqual(httpBodyArguments?["otpPassword"] as? String, expectedBody["otpPassword"] as? String)

            onRequestExpectation.fulfill()
        })
        mock.register()
        
        let testSubject = await prepare(withSignIn: signinTokens)
    
        let _ = await testSubject.signInOtp(otp: "123456")
        
        await fulfillment(of:[onRequestExpectation], timeout: 10.0)
    }
    
    func testSignInOtpShouldReturnErrorIfNoSignInTokens() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signinOtp")!
        Mock(url: originalURL, contentType: .json, statusCode: 400, data: [
            .post : Data()
        ]).register()
        
        let testSubject = await prepare()
    
        let result = await testSubject.signInOtp(otp: "123456")
        let isBusy = await testSubject.isBusy
        
        XCTAssertFalse(isBusy)
        XCTAssertThrowsError(try result.get()) { error in
            XCTAssertEqual(error as! SignInError, .signInNoToken)
        }
    }
    
    func testSignInOtpShouldReturnErrorIfHttpErrorReturns() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signinOtp")!
        let data = try? JSONSerialization.data(withJSONObject: ["userId": "32", "otpToken": "AAAAA", "otpUrl": "", "otpBarcode": ""], options: [])
        let signinTokens = try JSONDecoder().decode(SignInTokensDto.self, from: data!)

        Mock(url: originalURL, contentType: .json, statusCode: 400, data: [
            .post : Data()
        ]).register()
        
        let testSubject = await prepare(withSignIn: signinTokens)
    
        let result = await testSubject.signInOtp(otp: "123456")
        let isBusy = await testSubject.isBusy
        
        XCTAssertFalse(isBusy)
        XCTAssertThrowsError(try result.get()) { error in
            XCTAssertEqual(error as! SignInError, .signInConfirmToken)
        }
    }
    
    func testSignInOtpShouldReturnAccessToken() async throws {
        let originalURL = URL(string: "\(apiUrl)/auth/signinOtp")!
        let data = try? JSONSerialization.data(withJSONObject: ["userId": "32", "otpToken": "AAAAA", "otpUrl": "", "otpBarcode": ""], options: [])
        let signinTokens = try JSONDecoder().decode(SignInTokensDto.self, from: data!)
        Mock(url: originalURL, contentType: .json, statusCode: 200, data: [
            .post : try! Data(contentsOf: MockedData.signUpOtpResponse)
        ]).register()
        
        let testSubject = await prepare(withSignIn: signinTokens)
    
        let result = await testSubject.signInOtp(otp: "123456")
        let isSignedIn = await testSubject.isSignedIn
        let needsSignUp = await testSubject.needsSignUp
        let isBusy = await testSubject.isBusy
        let accessTokens = await testSubject.accessTokens
        let success = try result.get();
        
        XCTAssertTrue(success)
        XCTAssertTrue(isSignedIn)
        XCTAssertFalse(needsSignUp)
        XCTAssertFalse(isBusy)
        XCTAssertEqual(accessTokens?.accessToken, "AAAAAA")
        XCTAssertEqual(accessTokens?.refreshToken, "BBBBBB")
    }
    
    func testSignOutShoudlReturnTrue() async throws {
        
        let testSubject = await prepare()
        
        let result = await testSubject.signOut()
        let success = try result.get();

        XCTAssertTrue(success)
    }
}
