#ifndef OINKBREW_CONTROLLER_CONTROLLERCONFIGURATION_H_
#define OINKBREW_CONTROLLER_CONTROLLERCONFIGURATION_H_

#include "../devices/Device.h"
#include <stdint.h>

const short MAX_CONTROLLERS = 3;

struct ActingDevice
{
    uint8_t pin_nr;
    DeviceAddress hw_address;
};

enum ControllerType : uint8_t
{
    TYPE_NONE = 0,
    TYPE_BREW = 1,
    TYPE_FRIDGE = 2
};

struct ControllerConfiguration
{
    int id;
    ControllerType type;

    float temperature;
    ActingDevice heatActuator;
    ActingDevice tempSensor;
    unsigned int heatingPeriod;
    float p;
    float i;
    float d;

    // Fridge
    ActingDevice coolActuator;
    ActingDevice fanActuator;
    float fanPwm;
    unsigned int coolingPeriod;
    unsigned int coolingOnTime;
    unsigned int coolingOffTime;

    // Brew
    ActingDevice pump1Actuator;
    ActingDevice pump2Actuator;
    float heaterPwm;
    float pump1Pwm;
    float pump2Pwm;
};

#endif /* OINKBREW_CONTROLLER_CONTROLLERCONFIGURATION_H_ */
