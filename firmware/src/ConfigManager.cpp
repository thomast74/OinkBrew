#include "ConfigManager.h"
#include "Particle.h"

ReceivedConfig ConfigManager::parse(String functionData)
{
    ReceivedConfig config;

    JSONValue outerObj = JSONValue::parseCopy(functionData);
    JSONObjectIterator iter(outerObj);
    while (iter.next())
    {
        if (iter.name() == "command")
        {
            config.command = static_cast<Command>(iter.value().toInt());
        }
        else if (iter.name() == "data")
        {
            config.data = iter.value();
        }
    }

    return config;
}

DeviceRequest ConfigManager::parseDeviceRequest(JSONValue data)
{
    DeviceRequest request;

    JSONObjectIterator iter(data);
    while (iter.next())
    {
        if (iter.name() == "pin_nr")
        {
            request.pin_nr = iter.value().toInt();
        }
        else if (iter.name() == "hw_address")
        {
            const char *hw_address = iter.value().toString().data();
            ConfigManager::setBytes(request.hw_address, hw_address, 8);
        }
        else if (iter.name() == "offset")
        {
            request.offset = iter.value().toDouble();
        }
    }

    return request;
}

ControllerConfiguration ConfigManager::parseControllerConfiguration(JSONValue data)
{
    ControllerConfiguration configuration;

    JSONObjectIterator iter(data);
    while (iter.next())
    {
        if (iter.name() == "id")
        {
            configuration.id = iter.value().toInt();
        }
        else if (iter.name() == "type")
        {
            configuration.type = static_cast<ControllerType>(iter.value().toInt());
        }
        else if (iter.name() == "temperature")
        {
            configuration.temperature = iter.value().toDouble();
        }
        else if (iter.name() == "heatActuator")
        {
            configuration.heatActuator = parseActingDevice(iter.value());
        }
        else if (iter.name() == "tempSensor")
        {
            configuration.tempSensor = parseActingDevice(iter.value());
        }
        else if (iter.name() == "heatingPeriod")
        {
            configuration.heatingPeriod = iter.value().toInt();
        }
        else if (iter.name() == "p")
        {
            configuration.p = iter.value().toDouble();
        }
        else if (iter.name() == "i")
        {
            configuration.i = iter.value().toDouble();
        }
        else if (iter.name() == "d")
        {
            configuration.d = iter.value().toDouble();
        }

        // Fridge Configuration
        else if (iter.name() == "coolActuator")
        {
            configuration.coolActuator = parseActingDevice(iter.value());
        }
        else if (iter.name() == "fanActuator")
        {
            configuration.fanActuator = parseActingDevice(iter.value());
        }
        else if (iter.name() == "fanPwm")
        {
            configuration.fanPwm = iter.value().toDouble();
        }
        else if (iter.name() == "coolingPeriod")
        {
            configuration.coolingPeriod = iter.value().toInt();
        }
        else if (iter.name() == "coolingOnTime")
        {
            configuration.coolingOnTime = iter.value().toInt();
        }
        else if (iter.name() == "coolingOffTime")
        {
            configuration.coolingOffTime = iter.value().toInt();
        }

        // Brew Configuration
        else if (iter.name() == "pump1Actuator")
        {
            configuration.pump1Actuator = parseActingDevice(iter.value());
        }
        else if (iter.name() == "pump2Actuator")
        {
            configuration.pump2Actuator = parseActingDevice(iter.value());
        }
        else if (iter.name() == "heaterPwm")
        {
            configuration.heaterPwm = iter.value().toDouble();
        }
        else if (iter.name() == "pump1Pwm")
        {
            configuration.pump1Pwm = iter.value().toDouble();
        }
        else if (iter.name() == "pump2Pwm")
        {
            configuration.pump2Pwm = iter.value().toDouble();
        }
    }

    return configuration;
}

ActingDevice ConfigManager::parseActingDevice(JSONValue data)
{
    ActingDevice device;

    JSONObjectIterator iter(data);
    while (iter.next())
    {
        if (iter.name() == "pin_nr")
        {
            device.pin_nr = iter.value().toInt();
        }
        else if (iter.name() == "hw_address")
        {
            const char *hw_address = iter.value().toString().data();
            setBytes(device.hw_address, hw_address, 8);
        }
    }

    return device;
}

void ConfigManager::setBytes(uint8_t *data, const char *s, uint8_t len)
{
    char c;
    while ((c = *s++))
    {
        uint8_t d = (c >= 'A' ? c - 'A' + 10 : c - '0') << 4;
        c = *s++;
        d |= (c >= 'A' ? c - 'A' + 10 : c - '0');
        *data++ = d;
    }
}
