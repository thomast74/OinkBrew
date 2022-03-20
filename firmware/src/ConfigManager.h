#ifndef OINKBREW_CONFIG_MANAGER_H_
#define OINKBREW_CONFIG_MANAGER_H_

#include "Particle.h"
#include "devices/DeviceManager.h"
#include "controller/ControllerConfiguration.h"

enum Command
{
    NONE,
    OFFSET,
    UPDATE_CONFIGURATION,
    REMOVE_CONFIGURATION,
    RESTART
};

struct ReceivedConfig
{
    Command command;
    JSONValue data;
};

class ConfigManager
{
public:
    static ReceivedConfig parse(String functionData);
    static DeviceRequest parseDeviceRequest(JSONValue data);
    static ControllerConfiguration parseControllerConfiguration(JSONValue data);

private:
    static ActingDevice parseActingDevice(JSONValue data);
    static void setBytes(uint8_t *data, const char *s, uint8_t len);
};

#endif /* OINKBREW_CONFIG_MANAGER_H_ */