# Data send for "setConfig"

```
{
  "command": int (1-OFFSET; 2-UPDATE_CONFIGURATION; 3-REMOVE_CONFIGURATION; 4-RESTART),
  "data": json
}
```

# OFFSET

```
{
  "pin_nr": int,
  "hw_address": string,
  "offset": signed double
}
```

# UPDATE_CONFIGURATION

## Brew Configuration

```
{
  "id": int,
  "type": int (1-TYPE_BREW),
  "temperature": double,
  "heatActuator": {
    "pin_nr": int,
    "hw_address": string,
  },
  "tempSensor": {
    "pin_nr": int,
    "hw_address": string,
  },
  "heatingPeriod": int,
  "p": double,
  "i": double,
  "d": double,
  "pump1Actuator": {
    "pin_nr": int,
    "hw_address": string,
  },
  "pump2Actuator": {
    "pin_nr": int,
    "hw_address": string,
  },
  "heaterPwm": double,
  "pump1Pwm": double,
  "pump2Pwm": double,
}
```

## Fridge Configuration

```
{
  "id": int,
  "type": int (2-TYPE_FRIDGE),
  "temperature": double,
  "heatActuator": {
    "pin_nr": int,
    "hw_address": string,
  },
  "tempSensor": {
    "pin_nr": int,
    "hw_address": string,
  },
  "heatingPeriod": int,
  "p": double,
  "i": double,
  "d": double,
  "coolActuator": {
    "pin_nr": int,
    "hw_address": string,
  },
  fanActuator: {
    "pin_nr": int,
    "hw_address": string,
  },
  "fanPwm": double,
  "coolingPeriod": int,
  "coolingOnTime": int,
  "coolingOffTime": int,
}
```

# REMOVE_CONFIGURATION

```
{
  "id": int,
}
```

# RESTART

```
{}
```
