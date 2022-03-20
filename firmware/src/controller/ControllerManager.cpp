#include "Particle.h"
#include "ControllerManager.h"
#include "ControllerConfiguration.h"
#include "BrewController.h"
#include "FridgeController.h"

ControllerManager::ControllerManager() {}

void ControllerManager::setupVariable()
{
    Particle.variable("Configurations", [this]()
                      { return this->getConfigurationsJson(); });
}

void ControllerManager::process()
{
    for (short i = 0; i < registered_controllers; i++)
    {
        active_controllers[i]->process();
    }
}

void ControllerManager::update()
{
    for (short i = 0; i < registered_controllers; i++)
    {
        active_controllers[i]->update();
    }
}

bool ControllerManager::changeController(ControllerConfiguration configuration)
{
    int index = findController(configuration.id);

    if (index >= 0)
    {
        active_controllers[index]->dispose();
        if (active_controllers[index]->getConfig().type == configuration.type)
        {
            active_controllers[index]->setConfig(configuration);
        }
        else
        {
            delete active_controllers[index];
            createController(configuration, index);
        }
    }
    else
    {
        createController(configuration, -1);
    }

    return true;
}

void ControllerManager::createController(ControllerConfiguration configuration, int position)
{
    bool created = false;
    int index = position == -1 ? registered_controllers : position;

    if (configuration.type == TYPE_BREW)
    {
        Log.info("Add new brew controller");
        active_controllers[index] = new BrewController(configuration);
        created = true;
    }
    else if (configuration.type == TYPE_FRIDGE)
    {
        Log.info("Add new fridge controller");
        active_controllers[index] = new FridgeController(configuration);
        created = true;
    }
    else
    {
        Log.info("Configuration type unknown");
        created = false;
    }

    if (created && position == -1)
    {
        registered_controllers++;
    }
}

bool ControllerManager::removeController(int id)
{
    Controller *new_active_controllers[MAX_CONTROLLERS] = {};
    bool removed = false;
    short new_registered_controllers = 0;

    for (int i = 0; i < registered_controllers; i++)
    {
        if (active_controllers[i]->getId() == id)
        {
            active_controllers[i]->dispose();
            delete active_controllers[i];

            removed = true;
        }
        else
        {
            new_active_controllers[new_registered_controllers] = active_controllers[i];
            new_registered_controllers++;
        }
    }

    if (removed)
    {
        memcpy(active_controllers, new_active_controllers, sizeof(new_active_controllers));
        registered_controllers = new_registered_controllers;
    }
    else
    {
        Log.info("Configuration with id %d not found", id);
    }

    return removed;
}

int ControllerManager::findController(int id)
{
    for (short i = 0; i < registered_controllers; i++)
    {
        if (active_controllers[i]->getId() == id)
        {
            return i;
        }
    }

    return -1;
}

String ControllerManager::getConfigurationsJson()
{
    char buf[512];
    JSONBufferWriter writer(buf, sizeof(buf));

    writer.beginArray();

    for (short i = 0; i < registered_controllers; i++)
    {
        writer.beginObject();
        writer.name("id").value(active_controllers[i]->getConfig().id);
        writer.name("type").value(active_controllers[i]->getConfig().type);

        writer.name("temperature").value(active_controllers[i]->getConfig().temperature);
        writer.name("heatingPeriod").value(active_controllers[i]->getConfig().heatingPeriod);
        writer.name("p").value(active_controllers[i]->getConfig().p);
        writer.name("i").value(active_controllers[i]->getConfig().i);
        writer.name("d").value(active_controllers[i]->getConfig().d);
        writer.name("heatActuator").beginObject().name("pin_nr").value(active_controllers[i]->getConfig().heatActuator.pin_nr).name("hw_address").value(active_controllers[i]->getConfig().heatActuator.hw_address).endObject();
        writer.name("tempSensor").beginObject().name("pin_nr").value(active_controllers[i]->getConfig().tempSensor.pin_nr).name("hw_address").value(active_controllers[i]->getConfig().tempSensor.hw_address).endObject();

        if (active_controllers[i]->getConfig().type == ControllerType::TYPE_BREW)
        {
            writer.name("pump1Actuator").beginObject().name("pin_nr").value(active_controllers[i]->getConfig().pump1Actuator.pin_nr).name("hw_address").value(active_controllers[i]->getConfig().pump1Actuator.hw_address).endObject();
            writer.name("pump2Actuator").beginObject().name("pin_nr").value(active_controllers[i]->getConfig().pump2Actuator.pin_nr).name("hw_address").value(active_controllers[i]->getConfig().pump2Actuator.hw_address).endObject();
            writer.name("heaterPwm").value(active_controllers[i]->getConfig().heaterPwm);
            writer.name("pump1Pwm").value(active_controllers[i]->getConfig().pump1Pwm);
            writer.name("pump2Pwm").value(active_controllers[i]->getConfig().pump2Pwm);
        }

        if (active_controllers[i]->getConfig().type == ControllerType::TYPE_FRIDGE)
        {
            writer.name("coolActuator").beginObject().name("pin_nr").value(active_controllers[i]->getConfig().coolActuator.pin_nr).name("hw_address").value(active_controllers[i]->getConfig().coolActuator.hw_address).endObject();
            writer.name("fanActuator").beginObject().name("pin_nr").value(active_controllers[i]->getConfig().fanActuator.pin_nr).name("hw_address").value(active_controllers[i]->getConfig().fanActuator.hw_address).endObject();
            writer.name("fanPwm").value(active_controllers[i]->getConfig().fanPwm);
            writer.name("coolingPeriod").value(active_controllers[i]->getConfig().coolingPeriod);
            writer.name("coolingOnTime").value(active_controllers[i]->getConfig().coolingOnTime);
            writer.name("coolingOffTime").value(active_controllers[i]->getConfig().coolingOffTime);
        }

        writer.endObject();
    }

    writer.endArray();
    writer.buffer()[std::min(writer.bufferSize(), writer.dataSize())] = 0;

    return String(writer.buffer());
}
