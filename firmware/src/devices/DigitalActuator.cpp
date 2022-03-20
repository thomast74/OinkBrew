#include "DigitalActuator.h"
#include "spark_wiring.h"
#include <string.h>

DigitalActuator::DigitalActuator(uint8_t pin, DeviceAddress &hw_address, bool invert)
{
    this->pin = pin;
    memcpy(&this->hw_address, &hw_address, 8);
    this->invert = invert;

    pinMode(pin, OUTPUT);

    this->active =
        digitalRead(pin) == HIGH ? true ^ this->invert : false ^ this->invert;
}

void DigitalActuator::setActive(bool active)
{
    this->active = active;

    digitalWrite(pin, active ^ invert ? HIGH : LOW);
}

bool DigitalActuator::toggle()
{
    setActive(!this->active);

    return this->active;
}

bool DigitalActuator::isActive()
{
    return active;
}

uint8_t &DigitalActuator::getPin()
{
    return pin;
}

DeviceAddress &DigitalActuator::getHwAddress()
{
    return hw_address;
}
