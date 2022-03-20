#include "FridgeController.h"
#include "../devices/DeviceManager.h"
#include "spark_wiring_ticks.h"

FridgeController::FridgeController(ControllerConfiguration &config)
    : Controller()
{
    this->state = IDLE;

    this->coolingOnTime = 0;
    this->coolingOffTime = 0;

    this->coolActuator = NULL;
    this->fanActuator = NULL;

    this->setConfig(config);
}

void FridgeController::dispose()
{
    Controller::dispose();

    turnOffCooler();
    turnOffFan();

    this->state = IDLE;

    this->coolingOnTime = 0;
    this->coolingOffTime = 0;

    if (this->coolActuator != NULL)
    {
        delete this->coolActuator;
        this->coolActuator = NULL;
    }

    if (this->fanActuator != NULL)
    {
        delete this->fanActuator;
        this->fanActuator = NULL;
    }
}

void FridgeController::setConfig(ControllerConfiguration &config)
{
    Controller::setConfig(config);

    this->setCoolActuator(getConfig().coolActuator);
    this->setFanActuator(getConfig().fanActuator);

    this->setSetPoint(getConfig().temperature);

    getPID()->SetOutputLimits(-100, 100);
    getPID()->SetMode(PID_AUTOMATIC);

    turnOnFan();
}

void FridgeController::doProcess()
{
    float output = getOutput();

    if (output > 1.0)
    {
        turnOnHeater(output);
    }
    else if (output < -1.0)
    {
        turnOnCooler(output);
    }
    else
    {
        setIdle();
    }
}

void FridgeController::update()
{
    if (this->coolActuator != NULL)
    {
        coolActuator->updatePwm();
    }
    else
    {
        Controller::update();
    }
}

void FridgeController::turnOnHeater(float pwm)
{
    if (isCoolerOn() && (millis() - this->coolingOnTime) < getConfig().coolingOnTime)
        return;

    this->turnOffCooler();
    Controller::turnOnHeater(pwm);

    this->state = HEATING;
}

void FridgeController::turnOnCooler(float pwm)
{
    if (isCoolerOff() && isCoolerOffTimeSet())
    {
        if ((millis() - this->coolingOffTime) < getConfig().coolingOffTime)
        {
            return;
        }
    }

    turnOffHeater();

    if (this->coolingOnTime == 0)
    {
        this->coolingOnTime = millis();
        this->coolingOffTime = 0;
    }

    this->coolActuator->setPwm(pwm * -1);
    this->coolActuator->updatePwm();

    DeviceManager::getInstance().setDeviceValue(this->coolActuator->getPin(), this->coolActuator->getHwAddress(), (pwm * -1));

    this->state = COOLING;
}

void FridgeController::turnOffCooler()
{
    if (isCoolerOn())
    {
        this->coolActuator->stopPwm();

        this->coolingOnTime = 0;
        if (this->coolingOffTime == 0)
            this->coolingOffTime = millis();

        DeviceManager::getInstance().setDeviceValue(this->coolActuator->getPin(), this->coolActuator->getHwAddress(), 0);
    }
}

void FridgeController::turnOnFan()
{
    if (this->fanActuator != NULL)
    {
        this->fanActuator->setPwm(getConfig().fanPwm);
    }
}

void FridgeController::turnOffFan()
{
    if (this->fanActuator != NULL)
    {
        this->fanActuator->stopPwm();
    }
}

void FridgeController::setIdle()
{
    turnOffHeater();

    if (isCoolerOn() && (millis() - this->coolingOnTime) < getConfig().coolingOnTime)
        return;
    else
        turnOffCooler();

    this->state = IDLE;
}

void FridgeController::setCoolActuator(ActingDevice CoolActuator)
{
    if (CoolActuator.pin_nr != 0)
    {
        this->coolActuator = new PwmActuator(CoolActuator.pin_nr, CoolActuator.hw_address, 0, getConfig().coolingPeriod, true);
        this->coolActuator->setMinimumOnTime(getConfig().coolingOnTime);
    }
}

void FridgeController::setFanActuator(ActingDevice FanActuator)
{
    if (FanActuator.pin_nr != 0)
    {
        this->fanActuator = new PwmActuator(FanActuator.pin_nr, FanActuator.hw_address, 0, 0, false);
    }
}

bool FridgeController::isCoolerOn()
{
    if (this->coolActuator != NULL)
    {
        return this->coolActuator->isActive();
    }
    else
        return false;
}

bool FridgeController::isCoolerOff()
{
    return !isCoolerOn();
}

bool FridgeController::isCoolerOffTimeSet()
{
    return this->coolingOffTime > 0;
}
