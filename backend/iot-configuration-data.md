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
  "pinNr": int,
  "hwAddress": string,
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
    "pinNr": int,
    "hwAddress": string,
  },
  "tempSensor": {
    "pinNr": int,
    "hwAddress": string,
  },
  "heatingPeriod": int,
  "p": double,
  "i": double,
  "d": double,
  "pump1Actuator": {
    "pinNr": int,
    "hwAddress": string,
  },
  "pump2Actuator": {
    "pinNr": int,
    "hwAddress": string,
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
    "pinNr": int,
    "hwAddress": string,
  },
  "tempSensor": {
    "pinNr": int,
    "hwAddress": string,
  },
  "heatingPeriod": int,
  "p": double,
  "i": double,
  "d": double,
  "coolActuator": {
    "pinNr": int,
    "hwAddress": string,
  },
  fanActuator: {
    "pinNr": int,
    "hwAddress": string,
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
