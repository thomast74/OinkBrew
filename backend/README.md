# Oinkbrew Backend Server

## Configuration Defaults

Configuratio defaults are setup when the backend starts the first time and can be changed via settings api for future configurations.
When a configuration is created and the below properies are not set when received the mentioned values are used instead.

### Brew Configration

| Property      | Value  |
| ------------- | ------ |
| temperature   | 1.0    |
| pump1Pwm      | 0.0    |
| pump2Pwm      | 0.0    |
| heatingPeriod | 2000   |
| pid.p         | 90.0   |
| pid.i         | 0.0001 |
| pid.d         | -45.0  |

### Fridge Configuration

| Property       | Value  |
| -------------- | ------ |
| temperature    | 19.0   |
| fanPwm         | 100.0  |
| heatingPeriod  | 1000   |
| coolingPeriod  | 600000 |
| coolingOnTime  | 150000 |
| coolingOffTime | 180000 |
| pid.p          | 18.0   |
| pid.i          | 0.0001 |
| pid.d          | -8.0   |
