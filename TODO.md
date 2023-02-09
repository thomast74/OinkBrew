# Project To Do

## Firmware

| Short | Description | Done |
| ----- | ----------- | ---- |
|       |             |      |

## Backend

| Done | Short                                   | Description                                                                                             |
| ---- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
|      | GET /devices                            | Get a list of currently stored devices with attached devices and sensors                                |
|      | POST /devices/{id}                      | Update Device Name and certain properties                                                               |
|      | POST /devices/{id}/{pinNr}/{hw_address} | Update certain properties of a sensor attached to a specific device                                     |
|      | Configuration DB Backend                | Ability to create/update a Brew/Ferment configuration                                                   |
|      | GET /configurations                     | Get a list of all configurations, option is active and non-active                                       |
|      | PUT /configurations                     | Create a new configuration, wither Brew or Ferement                                                     |
|      | POST /configurations/{id}               | Update a current configuration, if active and attached to a device send configuration to device         |
|      | EVT /oinkbrew/start                     | When event received send active configuration to device                                                 |
|      | EVT /oinkbrew/devices/values            | Receive data vales and attach sensor data to conifguration                                              |
|      | GET /configurations/{id}/events         | Get a list of all events attached to configuration. This starts an active streamwith consistent updates |

## Mobile iOS

| Short | Description | Done |
| ----- | ----------- | ---- |
|       |             |      |
