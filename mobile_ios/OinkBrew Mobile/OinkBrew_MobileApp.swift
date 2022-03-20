//
//  OinkBrew_MobileApp.swift
//  OinkBrew Mobile
//
//  Created by Thomas Trageser on 05/07/2021.
//

import SwiftUI

@main
struct OinkBrew_MobileApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var loginViewModel = LoginView.LoginViewModel()
    
    var body: some Scene {
        WindowGroup {
            LoginView().environmentObject(loginViewModel)
        }
    }
}
