#ifndef OINKBREW_CONTROLLER_FRIDGECONTROLLER_H_
#define OINKBREW_CONTROLLER_FRIDGECONTROLLER_H_

#include "Controller.h"
#include "../devices/DigitalActuator.h"

class FridgeController : public Controller
{
public:
    FridgeController(ControllerConfiguration &config);
    void dispose();

    void setConfig(ControllerConfiguration &config);
    void update();

protected:
    void doProcess();
    void turnOnHeater(float pwm);

private:
    void turnOnCooler(float pwm);
    void turnOffCooler();

    void turnOnFan();
    void turnOffFan();

    bool isCoolerOn();
    bool isCoolerOff();
    bool isCoolerOffTimeSet();

    void setIdle();

    void setCoolActuator(ActingDevice CoolActuator);
    void setFanActuator(ActingDevice FanActuator);

    PwmActuator *coolActuator;
    PwmActuator *fanActuator;
    ControllerState state;

    unsigned long coolingOffTime;
    unsigned long coolingOnTime;
};

#endif /* OINKBREW_CONTROLLER_FRIDGECONTROLLER_H_ */
