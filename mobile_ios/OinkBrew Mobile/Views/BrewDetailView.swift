//
//  BrewDetailView.swift
//  OinkBrew Mobile
//
//  Created by Thomas Trageser on 02/06/2024.
//

import SwiftUI

struct BrewDetailView: View {
    let configuration: BeerConfiguration
    
    var body: some View {
        Text(configuration.name)
    }
}

#Preview {
    BrewDetailView(configuration: beerConfigurations[0])
}
