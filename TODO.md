# Project To Do

## Firmware

| Short | Description | Done |
| ----- | ----------- | ---- |
|       |             |      |

## Backend

| Done | Short                                  | Description                                                                                                    |
| ---- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| X)   | GET /devices                           | Get a list of currently stored devices with attached devices and sensors                                       |
| X)   | PUT /devices/refresh                   | To refresh devices from ParticleIO                                                                             |
| X)   | PUT /devices/{id}                      | Update Device Name and Notes, including updating ParticleIO                                                    |
| X)   | PUT /devices/{id}/{pinNr}/{hw_address} | Update certain properties of a sensor attached to a specific device                                            |
| X)   | Change Database Backend                | Change database backend from PostgreSQL to Mongo                                                               |
| X)   | Configuration DB Backend               | Ability to create/update a Brew/Ferment configuration                                                          |
| X)   | GET /configurations                    | Get a list of all configurations, option is active and non-active                                              |
| X)   | Configuration to Device assignment     | A configuration needs to be assigned to a device, change from Prisma to Mongoose                               |
| X)   | POST /configurations                   | Create a new configuration, either Brew or Ferment, incl data verification of all fields and connected devices |
| X)   | PUT /configurations/{id}               | Update a current configuration, if active and attached to a device send configuration to device                |
| X)   | DELETE /configurations/{id}            | Archive configuration and remove from device                                                                   |
| X)   | PUT /devices/{id}/restart              | Send restart command to device                                                                                 |
| X)   | EVT /oinkbrew/start                    | When event received send active configuration to device + offset for sensors                                   |
| X)   | EVT /oinkbrew/new                      | When device is newly discovered and sensor is connected send offset to device if differen to 0 and connected   |
| X)   | EVT /oinkbrew/device/values            | Receive data vales and attach sensor data to conifguration                                                     |
| X)   | GET /configurations/{id}/sensordata    | Get a list of all sensor data attached to configuration.                                                       |
| X)   | SSE /configurations/{id}/sse           | Get a stream of events attached to configuration.                                                              |
|      | Updating README.md                     |                                                                                                                |

## Mobile iOS

| Short | Description | Done |
| ----- | ----------- | ---- |
|       |             |      |
