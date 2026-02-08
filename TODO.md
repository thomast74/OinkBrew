# Project To Do

## Firmware

| Done | Short | Description |
| ---- | ----- | ----------- |
|      |       |             |

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
|      | Updating README.md                     | Update README.md to make at align with the backend implementation                                              |

## Mobile iOS

| Done | Short                                             | Description                                                                                                 |
| ---- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
|      | Create configuration list screen                  | Create general configuration screen with left a list and on the right the details                           |
|      | Make list of card fragments                       | Load configuration from backend and present in the left list                                                |
|      | Make configuration detail fragment                | Selected configuration from list is presented with general information                                      |
|      | Add option for advanced configurations parameters | Each configuration has default paramters which should be hidden but editable if needed                      |
|      | Add list search and filter                        | Configuration list needs to filters by archive/non-archived and searchable                                  |
|      | Make configuration detail editable                | Configuration details need to be editable for at least base information                                     |
|      | Archive/un-archive configuration                  | Add button to archive a configuration                                                                       |
|      | New configuration                                 | Add button to create a new configuration                                                                    |
|      | Create chart screen                               | Make screen and char sensor data                                                                            |
|      | Add fragment for details                          | Add fragment to show sensor configuration and latest values                                                 |
|      | Listen to SSE                                     | If active start listening to sensor data via SSE and chart new values                                       |
|      | Sensor & Actuator data update                     | Allow the update of sensor & actuator with backend update                                                   |
| X)   | Create Settings screen                            | Create screen to allow default parameter for each new configuration                                         |
| ->   | Save login access tokens until 401 error          | To avoid re-login all the time, save access tokens and return to login screen when 401 received             |
| X)   | Add side menu                                     | Add a side menu to be able to select Configurations, Devices, Preferences                                   |
| X)   | Split home screen                                 | Split home screen into sub screens (Configurations, Devices & Preferences) depending on side menu selection |
|      | Refactor Configuration                            | Refactor Configuration into three files each (listView, row view and detail view)                           |
|      | Refactor Side Menu View                           | Refactor Side Menu View into three files each (listView, row view and detail view)                          |
| X)   | Add Device List and Detail View                   | Split screen to show all stored devices and the details                                                     |
|      | Device Name Change                                | Allows to change the device name, with updating backend and cloud                                           |
