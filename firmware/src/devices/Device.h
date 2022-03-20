#ifndef OINKBREW_DEVICES_DEVICE_H_
#define OINKBREW_DEVICES_DEVICE_H_

#include <stdint.h>

typedef uint8_t DeviceAddress[8];

enum DeviceType : uint8_t
{
    DEVICE_HARDWARE_NONE = 0,
    DEVICE_HARDWARE_ACTUATOR_DIGITAL = 1, // digital pin, either on or off
    DEVICE_HARDWARE_ACTUATOR_PWM = 2,     // analogue pin, used as PWM actuator
    DEVICE_HARDWARE_ONEWIRE_TEMP = 3,     // a onewire temperature sensor
};

struct Device
{
    uint8_t pin_nr;
    DeviceAddress hw_address;
    DeviceType type;
    float value;
    float offset;
    bool newly_found;
    unsigned long lastSeen;
};

#endif /* OINKBREW_DEVICES_DEVICE_H_ */
