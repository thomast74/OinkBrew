#ifndef OINKBREW_CONTROLLER_CONTROLLER_H_
#define OINKBREW_CONTROLLER_CONTROLLER_H_

#define OVERSHOOT_HEAT 0.0
#define OVERSHOOT_KEEP 0.0

#include "PID.h"
#include "ControllerConfiguration.h"
#include "../devices/PwmActuator.h"

enum ControllerState
{
    IDLE,
    HEATING,
    COOLING
};

class Controller
{
public:
    Controller();
    virtual ~Controller();

    virtual void dispose();

    ControllerConfiguration &getConfig();
    virtual void setConfig(ControllerConfiguration &config);

    void process();
    virtual void update();

    float getTargetTemperature();
    void setTargetTemperature(float target);

    float getCurrentTemperature();

    int getId();

protected:
    virtual void doProcess(){};

    void setTempSensor(ActingDevice TempSensor);
    void setHeatActuator(ActingDevice HeatActuator);

    void setSetPoint(float newSetPoint);
    float getSetPoint();

    bool isHeaterOn();
    virtual void turnOnHeater(float pwm);
    virtual void turnOffHeater();

    PID *getPID();
    float getOutput();

    DeviceAddress DEVICE_ADDRESS_EMPTY = {0, 0, 0, 0, 0, 0, 0, 0};

private:
    ActingDevice tempSensor;
    PwmActuator *heatActuator;
    ControllerConfiguration config;

    float setPoint;
    float targetTemperature;
    float currentTemperature;
    float output;
    PID *pid;
};

#endif /* OINKBREW_CONTROLLER_CONTROLLER_H_ */
