#include "Controller.h"
#include "../devices/DeviceManager.h"
#include "../devices/DallasTemperatureSensor.h"

Controller::Controller()
{
    this->pid = NULL;
    this->heatActuator = NULL;

    this->output = 0.0;
    this->setPoint = 0.0;
    this->targetTemperature = 0.0;
    this->currentTemperature = 0.0;
}

Controller::~Controller() {}

void Controller::dispose()
{

    turnOffHeater();

    this->output = 0.0;
    this->setPoint = 0.0;
    this->targetTemperature = 0.0;
    this->currentTemperature = 0.0;

    if (this->heatActuator != NULL)
    {
        delete this->heatActuator;
        this->heatActuator = NULL;
    }

    if (this->pid != NULL)
    {
        delete this->pid;
        this->pid = NULL;
    }
}

void Controller::setConfig(ControllerConfiguration &config)
{
    memcpy(&this->config, &config, sizeof(ControllerConfiguration));

    setTempSensor(this->config.tempSensor);
    setHeatActuator(this->config.heatActuator);

    setTargetTemperature(getConfig().temperature);

    this->pid = new PID(&currentTemperature, &output, &setPoint, this->config.p, this->config.i, this->config.d, PID_DIRECT);
}

ControllerConfiguration &Controller::getConfig()
{
    return this->config;
}

void Controller::process()
{
    if (pid->GetMode() == PID_MANUAL)
        return;

    Device tempSensorDevice;
    DeviceManager::getInstance().getDevice(this->tempSensor.pin_nr, this->tempSensor.hw_address, tempSensorDevice);
    if (tempSensorDevice.value > DEVICE_DISCONNECTED_C)
    {
        this->currentTemperature = tempSensorDevice.value;

        if (pid->Compute())
        {
            doProcess();
        }
    }
}

void Controller::update()
{
    if (this->heatActuator != NULL && this->heatActuator->isActive())
    {
        this->heatActuator->updatePwm();
    }
}

void Controller::setTempSensor(ActingDevice TempSensor)
{
    memcpy(&this->tempSensor, &TempSensor, sizeof(ActingDevice));
}

void Controller::setHeatActuator(ActingDevice HeatActuator)
{
    if (HeatActuator.pin_nr != 0)
    {
        this->heatActuator = new PwmActuator(HeatActuator.pin_nr, HeatActuator.hw_address, 0, getConfig().heatingPeriod, true);
    }
}

bool Controller::isHeaterOn()
{
    if (this->heatActuator != NULL)
    {
        return this->heatActuator->isActive();
    }
    else
        return false;
}

void Controller::turnOnHeater(float pwm)
{
    if (this->heatActuator != NULL)
    {
        this->heatActuator->setPwm(pwm);
        this->heatActuator->updatePwm();

        DeviceManager::getInstance().setDeviceValue(this->heatActuator->getPin(), this->heatActuator->getHwAddress(), pwm);
    }
}

void Controller::turnOffHeater()
{
    if (isHeaterOn())
    {
        this->heatActuator->stopPwm();

        DeviceManager::getInstance().setDeviceValue(this->heatActuator->getPin(), this->heatActuator->getHwAddress(), 0);
    }
}

float Controller::getTargetTemperature()
{
    return this->targetTemperature;
}

void Controller::setTargetTemperature(float target)
{
    this->targetTemperature = target;
}

void Controller::setSetPoint(float newSetPoint)
{
    this->setPoint = newSetPoint;
}

float Controller::getSetPoint()
{
    return this->setPoint;
}

float Controller::getCurrentTemperature()
{
    return this->currentTemperature;
}

PID *Controller::getPID()
{
    return this->pid;
}

int Controller::getId()
{
    return this->config.id;
}

float Controller::getOutput()
{
    return this->output;
}
