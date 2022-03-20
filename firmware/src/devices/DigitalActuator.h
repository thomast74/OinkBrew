#pragma once

#include "../devices/Device.h"

class DigitalActuator
{
private:
    bool invert;
    uint8_t pin;
    DeviceAddress hw_address;
    bool active;

public:
    DigitalActuator(uint8_t pin, DeviceAddress &hw_address, bool invert);

    void setActive(bool active);
    bool toggle();
    bool isActive();
    uint8_t &getPin();
    DeviceAddress &getHwAddress();
};
