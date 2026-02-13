import Foundation

var beerConfigurations = [
    BeerConfiguration(
        type: 1,
        id: 1,
        createdAt: Date.now,
        updatedAt: Date.now,
        name: "Brew Configration",
        archived: false,
        device: devices[0],
        temperature: 65.0,
        heatActuator: ConnectedDevice(
            type: 2,
            pinNr: 17,
            hwAddress: "000000000000",
            connected: false,
            offset: 0.0,
            deviceOffset: 0.0
        ),
        tempSensor: ConnectedDevice(
            type: 3,
            pinNr: 0,
            hwAddress: "2A0000000000",
            connected: false,
            offset: 0.0,
            deviceOffset: 0.0
        ),
        heatingPeriod: 5000,
        p: 1,
        i: 2,
        d: 3
    ),
    BeerConfiguration(
        type: 2,
        id: 2,
        createdAt: Date.now,
        updatedAt: Date.now,
        name: "Fermentation Configration",
        archived: false,
        device: devices[0],
        temperature: 65.0,
        heatActuator: ConnectedDevice(
            type: 2,
            pinNr: 17,
            hwAddress: "000000000000",
            connected: false,
            offset: 0.0,
            deviceOffset: 0.0
        ),

        tempSensor: ConnectedDevice(
            type: 3,
            pinNr: 0,
            hwAddress: "28FF5C92711503AF",
            connected: false,
            offset: 0.0,
            deviceOffset: 0.0
        ),
        coolActuator: ConnectedDevice(
            type: 2,
            pinNr: 18,
            hwAddress: "000000000000",
            connected: false,
            offset: 0.0,
            deviceOffset: 0.0
        ),
        coolingPeriod: 5000,
        coolingOnTime: 10000,
        coolingOffTime: 60000,
        heatingPeriod: 5000,
        p: 1,
        i: 2,
        d: 3
    )
]

var devices = [
    Device(
        _id: "asdasda",
        __v: 0,
        id: "3b003d000747343232363230",
        createdAt: Date.now,
        updatedAt: Date.now,
        name: "Test Device",
        last_ip_address: "",
        last_heard: Date.now,
        last_handshake_at: Date.now,
        product_id: 1,
        online: false,
        connected: false,
        platform_id: 1,
        cellular: false,
        firmware_updates_enabled: true,
        firmware_updates_forced: false,
        status: "",
        serial_number: "",
        system_firmware_version: "",
        current_build_target: "",
        pinned_build_target: "",
        default_build_target: "",
        functions: [],
        variables: [:],
        connectedDevices: [
            ConnectedDevice(type: 1, pinNr: 17, hwAddress: "000000000000", connected: true, name: "Heater Relay", offset: 0.0, deviceOffset: 0.0),
            ConnectedDevice(type: 2, pinNr: 18, hwAddress: "000000000000", connected: true, name: "Cooling Fan", offset: 0.0, deviceOffset: 0.0),
            ConnectedDevice(type: 3, pinNr: 0, hwAddress: "28FF5C92711503AF", connected: true, name: "Chamber Temp", offset: -0.5, deviceOffset: 0.2)
        ]
    ),
    Device(
        _id: "weqweqwe",
        __v: 0,
        id: "280025000447343232363230",
        createdAt: Date.now,
        updatedAt: Date.now,
        name: nil,
        last_ip_address: "",
        last_heard: Date.now,
        last_handshake_at: Date.now,
        product_id: 1,
        online: false,
        connected: false,
        platform_id: 1,
        cellular: false,
        firmware_updates_enabled: true,
        firmware_updates_forced: false,
        status: "",
        serial_number: "",
        system_firmware_version: "",
        current_build_target: "",
        pinned_build_target: "",
        default_build_target: "",
        functions: [],
        variables: [:],
        connectedDevices: []
    )
]
