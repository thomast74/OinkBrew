#include "BrewController.h"
#include "../devices/Device.h"
#include "../devices/DeviceManager.h"

BrewController::BrewController(ControllerConfiguration &config)
    : Controller()
{
    this->pump1Actuator = NULL;
    this->pump2Actuator = NULL;

    setConfig(config);
}

void BrewController::dispose()
{
    Controller::dispose();

    turnOffPump1();
    turnOffPump2();

    if (this->pump1Actuator != NULL)
    {
        delete this->pump1Actuator;
        this->pump1Actuator = NULL;
    }

    if (this->pump2Actuator != NULL)
    {
        delete this->pump2Actuator;
        this->pump2Actuator = NULL;
    }
}

void BrewController::setConfig(ControllerConfiguration &config)
{
    Controller::setConfig(config);

    getPID()->SetOutputLimits(0, 100);

    if (getConfig().temperature > 0)
    {
        this->setSetPoint(getConfig().temperature - 0.5);
        getPID()->SetMode(PID_AUTOMATIC);
    }
    else
    {
        getPID()->SetMode(PID_MANUAL);
        turnOnHeater(getConfig().heaterPwm);
    }

    if (getConfig().pump1Pwm > 0)
    {
        this->setPump1Actuator(getConfig().pump1Actuator);
        this->turnOnPump1();
    }
    else
    {
        if (this->pump1Actuator != NULL)
        {
            delete this->pump1Actuator;
            this->pump1Actuator = NULL;
        }
    }

    if (getConfig().pump2Pwm > 0)
    {
        this->setPump2Actuator(getConfig().pump2Actuator);
        this->turnOnPump2();
    }
    else
    {
        if (this->pump2Actuator != NULL)
        {
            delete this->pump2Actuator;
            this->pump2Actuator = NULL;
        }
    }
}

void BrewController::doProcess()
{
    if (getConfig().temperature > 0 && this->getCurrentTemperature() > 0)
    {
        if (this->getSetPoint() != this->getTargetTemperature())
        {
            if (this->getCurrentTemperature() < this->getTargetTemperature() && this->getCurrentTemperature() > (this->getSetPoint() - 0.5))
            {
                this->setSetPoint(this->getTargetTemperature());
            }
        }

        float output = getOutput();

        if (output > 0)
            turnOnHeater(output);
        else
            turnOffHeater();
    }
}

void BrewController::setPump1Actuator(ActingDevice Pump1Actuator)
{
    if (Pump1Actuator.pin_nr != 0)
    {
        this->pump1Actuator = new PwmActuator(Pump1Actuator.pin_nr, Pump1Actuator.hw_address, 0, 0, false);
    }
}

void BrewController::turnOnPump1()
{
    if (this->pump1Actuator != NULL)
    {
        this->pump1Actuator->setPwm(getConfig().pump1Pwm);
        DeviceManager::getInstance().setDeviceValue(this->pump1Actuator->getPin(), this->pump1Actuator->getHwAddress(), getConfig().pump1Pwm);
    }
}

void BrewController::turnOffPump1()
{
    if (this->pump1Actuator != NULL)
    {
        this->pump1Actuator->setPwm(0);
        DeviceManager::getInstance().setDeviceValue(this->pump1Actuator->getPin(), this->pump1Actuator->getHwAddress(), 0);
    }
}

void BrewController::setPump2Actuator(ActingDevice Pump2Actuator)
{
    if (Pump2Actuator.pin_nr != 0)
    {
        this->pump2Actuator = new PwmActuator(Pump2Actuator.pin_nr, Pump2Actuator.hw_address, 0, 0, false);
    }
}

void BrewController::turnOnPump2()
{
    if (this->pump2Actuator != NULL)
    {
        this->pump2Actuator->setPwm(getConfig().pump2Pwm);
        DeviceManager::getInstance().setDeviceValue(this->pump2Actuator->getPin(), this->pump2Actuator->getHwAddress(), getConfig().pump2Pwm);
    }
}

void BrewController::turnOffPump2()
{
    if (this->pump2Actuator != NULL)
    {
        this->pump2Actuator->setPwm(0);
        DeviceManager::getInstance().setDeviceValue(this->pump2Actuator->getPin(), this->pump2Actuator->getHwAddress(), 0);
    }
}
