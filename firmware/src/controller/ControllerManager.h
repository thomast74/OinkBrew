#ifndef OINKBREW_CONTROLLER_CONTROLLERMANAGER_H_
#define OINKBREW_CONTROLLER_CONTROLLERMANAGER_H_

#include "Controller.h"
#include "ControllerConfiguration.h"
#include "BrewController.h"
#include "FridgeController.h"
#include "spark_wiring_string.h"

class ControllerManager
{
private:
    Controller *active_controllers[MAX_CONTROLLERS] = {};
    short registered_controllers = 0;
    ControllerManager();

public:
    static ControllerManager &getInstance()
    {
        static ControllerManager instance;
        return instance;
    }

    void setupVariable();
    void process();
    void update();

    bool changeController(ControllerConfiguration request);
    bool removeController(int id);

private:
    int findController(int id);
    void createController(ControllerConfiguration configuration, int position);

    String getConfigurationsJson();
};

#endif /* OINKBREW_CONTROLLER_CONTROLLERMANAGER_H_ */
