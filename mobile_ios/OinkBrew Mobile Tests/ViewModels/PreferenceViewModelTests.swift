import XCTest
@testable import OinkBrew_Mobile


class PreferenceViewModelTests: XCTestCase {
    private var userDefaults: UserDefaults!
    private var model: PreferenceViewModel!
    
    
    override func setUpWithError() throws {
        userDefaults = UserDefaults(suiteName: #file)
        userDefaults.removePersistentDomain(forName: #file)
    }
    
    func setup(apiUrl: String) {
        userDefaults.set(apiUrl, forKey: PREF_ApiUrl)
        
        model = PreferenceViewModel(userDefaults: userDefaults)
    }

    override func tearDownWithError() throws {
    }
    
    func testInitShouldLoadApiUrl() throws {
        let expectedApiUrl = "https://localhost:4200"
        setup(apiUrl: expectedApiUrl)
        
        XCTAssertEqual(model.apiUrl, expectedApiUrl, "Did not load Api Url during init")
        XCTAssertEqual(model.hasApiUrl, true, "Did not mark hasApiUrl as set")
    }
    
    func testInitShouldHasApiUrlFalseAfterFreshInstall() throws {
        setup(apiUrl: "")
        
        XCTAssertEqual(model.apiUrl, "", "Did not load empty")
        XCTAssertEqual(model.hasApiUrl, false, "Did not mark hasApiUrl as false")
    }
    
    func testSaveShouldCheckForValidUrl() async throws {
        setup(apiUrl: "")
        
        let result = await model.save(apiUrl: "faulty")
        
        XCTAssertEqual(result, .failure(.invalidUrl), "Did not mark as error result")
    }
        
    func testSaveShouldStoreValidUrl() async throws {
        let expectedApiUrl = "https://localhost:4200"
        setup(apiUrl: "")
        
        let result = await model.save(apiUrl: expectedApiUrl)
        
        XCTAssertEqual(result, .success(true), "Did not mark as success")
        XCTAssertEqual(model.apiUrl, expectedApiUrl, "Did not set new api url in model")
        XCTAssertEqual(userDefaults.string(forKey: PREF_ApiUrl), expectedApiUrl, "Did not set new api url in UserDefaults")
    }
}
