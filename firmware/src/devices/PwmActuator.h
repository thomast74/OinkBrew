#ifndef OINKBREW_DEVICES_PWMACTUATOR_H_
#define OINKBREW_DEVICES_PWMACTUATOR_H_

#include "../devices/Device.h"

const int START = 0;
const int IN_PULSE = 1;
const int PULSE_ENDED = 2;

class PwmActuator
{
private:
    uint8_t pin;
    DeviceAddress hw_address;
    float pwm;
    float minVal;
    float maxVal;
    unsigned long period;
    int currentState;
    bool active;
    bool simulate;

    unsigned long minimumOnTime;
    unsigned long minimumOffTime;

    unsigned long cycleStart;

public:
    PwmActuator(uint8_t pin, DeviceAddress &hw_address, float pwm, unsigned long period, bool simulate);

    void setPwm(float pwm);
    float getPwm();
    void setMinMax(float minVal, float maxVal);
    void setMinimumOnTime(unsigned long minOnTime);
    void updatePwm();
    void stopPwm();

    unsigned long getPeriod()
    {
        return period;
    }
    bool isActive()
    {
        return pwm > 0.0;
    }
    uint8_t &getPin()
    {
        return pin;
    }
    DeviceAddress &getHwAddress()
    {
        return hw_address;
    }
};

#endif // OINKBREW_DEVICES_PWMACTUATOR_H_
