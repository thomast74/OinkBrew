#ifndef OINKBREW_CONTROLLER_BREWCONTROLLER_H_
#define OINKBREW_CONTROLLER_BREWCONTROLLER_H_

#define BEER_OVERSHOOT_HEAT 0.5
#define BEER_OVERSHOOT_KEEP 0.5

#include "Controller.h"

class BrewController : public Controller
{
public:
    BrewController(ControllerConfiguration &config);
    void dispose();
    void setConfig(ControllerConfiguration &config);

protected:
    void doProcess();

private:
    void setPump1Actuator(ActingDevice Pump1Actuator);
    void setPump2Actuator(ActingDevice Pump2Actuator);
    void turnOnPump1();
    void turnOnPump2();
    void turnOffPump1();
    void turnOffPump2();

    PwmActuator *pump1Actuator;
    PwmActuator *pump2Actuator;
};

#endif /* OINKBREW_CONTROLLER_BREWCONTROLLER_H_ */
