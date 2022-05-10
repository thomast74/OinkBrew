import SwiftUI

struct PreferenceScreen: View {

    @EnvironmentObject var preference: PreferenceViewModel
    @EnvironmentObject var userState: UserStateViewModel
    
    @State private var apiUrl = ""
    @State private var error = ""
    @State private var isPerformingTask = false
    
    private let proportion = 0.43
    
    fileprivate func ApiUrlInput() -> some View {
        TextField("API Url", text: $apiUrl)
            .keyboardType(.URL)
            .textContentType(.URL)
            .disableAutocorrection(true)
            .autocapitalization(.none)
            .textFieldStyle(RoundedBorderLightTextFieldStyle())
            .onAppear {
                self.apiUrl = preference.apiUrl
            }
    }

    fileprivate func SaveButton() -> some View {
        Button("Save", action: {
            isPerformingTask = true
            Task {
                let result = await preference.save(
                    apiUrl: apiUrl
                )
                isPerformingTask = false
                switch result {
                case .failure(.invalidUrl):
                    error = "Invalid Url entered"
                case .failure(.saveError):
                    error = "Error while saving new Url"
                case .success(_): break
                }
            }
        })
        .buttonStyle(ActionButtonStyle())
        .disabled(isPerformingTask)
    }

    var body: some View {
        ZStack {
            BackgroundStartUpView()
            GeometryReader { geometry in
                Rectangle()
                    .fill(Color.black)
                    .opacity(0.4)
                    .cornerRadius(25)
                    .withProportionAndCenter(geometry, proportion)
                VStack{
                    if userState.isBusy {
                        ProgressView()
                    } else {
                        Text("Preferences")
                            .font(.title)
                            .foregroundColor(.white)
                            .padding(.top, 44)
                        ApiUrlInput()
                            .padding(.top, 22)
                            .padding(.horizontal, 22)
                            .padding(.bottom, 10)
                        Text(error)
                            .foregroundColor(.red)
                            .accessibility(identifier: "Error")
                            .frame(width: 140, height: 44, alignment: .center)
                            .padding(.bottom, 10)
                        SaveButton().padding(.bottom, 44)
                    }
                }
                .withProportionAndCenter(geometry, proportion)
            }
        }.edgesIgnoringSafeArea(.all)
         .preferredColorScheme(.dark)
    }
}
