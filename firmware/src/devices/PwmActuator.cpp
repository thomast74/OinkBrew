#include "PwmActuator.h"
#include "spark_wiring.h"

PwmActuator::PwmActuator(uint8_t pin, DeviceAddress &hw_address, float pwm,
                         unsigned long period, bool simulate)
{

    this->pin = pin;
    memcpy(&this->hw_address, &hw_address, sizeof(DeviceAddress));
    this->cycleStart = 0;
    this->simulate = simulate;
    this->pwm = 0;
    this->minVal = 0;
    this->maxVal = 100;
    this->period = period;
    this->minimumOnTime = 0;
    this->minimumOffTime = 0;
    this->active = false;
    this->currentState = START;
    pinMode(this->pin, OUTPUT);
    this->setPwm(pwm);
}

void PwmActuator::setMinMax(float minVal, float maxVal)
{
    this->minVal = minVal;
    this->maxVal = maxVal;
}

void PwmActuator::setMinimumOnTime(unsigned long minOnTime)
{
    this->minimumOnTime = minOnTime;
    if (this->minimumOnTime > this->period)
        this->minimumOnTime = this->period;
}

float PwmActuator::getPwm()
{
    return this->pwm;
}

void PwmActuator::setPwm(float val)
{
    if (this->simulate)
    {
        if (val <= this->minVal)
        {
            val = this->minVal;
        }
        if (val >= this->maxVal)
        {
            val = this->maxVal;
        }
        this->pwm = val;
    }
    else
    {
        this->pwm = val;

        float value = 0.0;
        if (this->pin == 16)
        {
            value = (4095.0000 / 100.0000) * this->pwm;
        }
        else
        {
            value = (255.0000 / 100.0000) * this->pwm;
        }
        analogWrite(this->pin, value);
        this->active = this->pwm > 0.0;
    }
}

void PwmActuator::updatePwm()
{
    if (!this->simulate)
        return;

    unsigned long runtime = 0;

    switch (currentState)
    {
    case START: // start of cycle
        this->cycleStart = millis();
        if (this->pwm > 0)
        {
            digitalWrite(this->pin, HIGH);
            currentState = IN_PULSE;
        }
        break;
    case IN_PULSE: // currently in high state, so keep track of when to end high state of pulse
        runtime = (this->pwm * this->period / 100);
        if (runtime < this->minimumOnTime)
        {
            runtime = this->minimumOnTime;
        }

        if (millis() >= (cycleStart + runtime))
        {
            if (this->pwm < 100)
            {
                digitalWrite(this->pin, LOW);
            }
            currentState = PULSE_ENDED;
        }
        break;
    case PULSE_ENDED:
        if (millis() >= (this->cycleStart + this->period))
        {
            currentState = START;
        }
        break;
    }
}

void PwmActuator::stopPwm()
{
    digitalWrite(this->pin, LOW);
    this->pwm = 0.0;
    currentState = START;
}
