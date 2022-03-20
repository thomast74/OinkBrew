#include "DeviceManager.h"
#include "Particle.h"

#include "../utils/Helper.h"
#include "../config/ShieldSpark.h"
#include "OneWire.h"
#include "DallasTemperatureSensor.h"
#include "DigitalActuator.h"
#include "PwmActuator.h"

OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);

DeviceManager::DeviceManager() {}

void DeviceManager::setupVariable()
{
    Particle.variable("Devices", [this]()
                      { return this->getDevicesJson(); });
}

void DeviceManager::init()
{
    // initialise actuator pins
    int8_t pin_nr;
    for (uint8_t count = 0; (pin_nr = enumerateActuatorPins(count)) >= 0; count++)
    {
        pinMode(pin_nr, OUTPUT);
        digitalWrite(pin_nr, 0);
    }

    // Start up the OneWire Library and temp sensors library
    sensors.begin();
    sensors.setWaitForConversion(false);
    sensors.requestTemperatures();
    delay(100);
}

bool DeviceManager::findNewDevices()
{
    bool new_device_found = false;
    uint8_t no_found_devices = 0;
    Device devices[MAX_DEVICES];

    if (registered_devices == 0)
        processActuators(devices, no_found_devices);

    processOneWire(devices, no_found_devices);

    for (short i = 0; i < no_found_devices; i++)
    {
        if (devices[i].newly_found)
        {
            if (devices[i].type == DEVICE_HARDWARE_NONE)
                continue;

            devices[i].newly_found = false;

            if (devices[i].type == DEVICE_HARDWARE_ONEWIRE_TEMP)
            {
                devices[i].value = sensors.getTempC(devices[i].hw_address);
                if (devices[i].value <= DEVICE_DISCONNECTED_C)
                {
                    continue;
                }
            }

            memcpy(&activeDevices[registered_devices], &devices[i], sizeof(Device));
            registered_devices++;

            Particle.publish("oinkbrew/devices/new", getDeviceJson(devices[i].pin_nr, devices[i].hw_address, devices[i].type));

            new_device_found = true;
        }
    }

    return new_device_found;
}

void DeviceManager::readValues()
{
    for (short i = 0; i < registered_devices; i++)
    {
        if (activeDevices[i].type == DEVICE_HARDWARE_ONEWIRE_TEMP)
        {

            activeDevices[i].value = sensors.getTempC(activeDevices[i].hw_address) + activeDevices[i].offset;

            if (activeDevices[i].value > DEVICE_DISCONNECTED_C)
            {
                activeDevices[i].lastSeen = millis();
            }
            else
            {
                // if no successful reading in 60 seconds remove device
                if ((millis() - activeDevices[i].lastSeen) > 60000)
                {
                    removeDevice(activeDevices[i].pin_nr, activeDevices[i].hw_address, activeDevices[i].type);
                }
            }
        }
    }

    // send request for sensor data so they are available next round in a second
    sensors.requestTemperatures();
}

void DeviceManager::clearDevices()
{
    uint32_t devicesize = sizeof(Device);
    registered_devices = 0;

    for (uint8_t i = 0; i < MAX_DEVICES; i++)
    {
        memset(&activeDevices[i], 0, devicesize);
    }
}

bool DeviceManager::removeDevice(uint8_t &pin_nr, DeviceAddress &hw_address, DeviceType &type)
{
    bool removed = false;
    short new_registered_devices = 0;
    Device newActiveDevices[MAX_DEVICES];

    for (uint8_t slot = 0; slot < registered_devices; slot++)
    {
        if (!(activeDevices[slot].pin_nr == pin_nr && Helper::matchAddress(hw_address, activeDevices[slot].hw_address, 8)))
        {
            newActiveDevices[new_registered_devices] = activeDevices[slot];
            new_registered_devices++;
        }
        else
        {
            removed = true;
        }
    }

    if (removed)
    {
        Particle.publish("oinkbrew/devices/remove", getDeviceJson(pin_nr, hw_address, type));
        memcpy(activeDevices, newActiveDevices, sizeof(newActiveDevices));
        registered_devices = new_registered_devices;
    }

    return removed;
}

void DeviceManager::setOffset(DeviceRequest &deviceRequest)
{
    for (uint8_t i = 0; i < registered_devices; i++)
    {
        if (activeDevices[i].pin_nr == deviceRequest.pin_nr && Helper::matchAddress(deviceRequest.hw_address, activeDevices[i].hw_address, 8))
        {
            Log.info("Setting offset");
            activeDevices[i].offset = deviceRequest.offset;
            return;
        }
    }
}

void DeviceManager::setDeviceValue(uint8_t &pin_nr, DeviceAddress &hw_address, float value)
{
    for (uint8_t i = 0; i < registered_devices; i++)
    {
        if (activeDevices[i].pin_nr == pin_nr && Helper::matchAddress(hw_address, activeDevices[i].hw_address, 8))
        {
            activeDevices[i].value = value;
            return;
        }
    }
}

void DeviceManager::processActuators(Device devices[], uint8_t &slot)
{
    int8_t pin_nr;
    for (uint8_t count = 0; (pin_nr = enumerateActuatorPins(count)) >= 0; count++)
    {
        Device device;

        device.pin_nr = pin_nr;
        Helper::setBytes(device.hw_address, "0000000000000000", 8);

        getDevice(device.pin_nr, device.hw_address, device);

        if (device.type == DEVICE_HARDWARE_NONE)
        {
            device.newly_found = true;
            device.type = DEVICE_HARDWARE_ACTUATOR_DIGITAL;
            device.value = 0;
        }

        memcpy(&devices[slot], &device, sizeof(Device));
        slot++;
    }
}

// finds all currently connected devices
// if one was disconnected?? needs to be removed
void DeviceManager::processOneWire(Device devices[], uint8_t &slot)
{
    DeviceAddress hw_address;

    oneWire.reset_search();

    while (oneWire.search(hw_address))
    {

        Device device;
        Device active;

        device.pin_nr = ONE_WIRE_PIN;
        memcpy(device.hw_address, hw_address, 8);

        getDevice(device.pin_nr, device.hw_address, active);

        // if not in active devices already, add it and read initial value
        if (active.type == DEVICE_HARDWARE_NONE)
        {
            device.newly_found = true;
            device.type = DEVICE_HARDWARE_ONEWIRE_TEMP;
            device.value = 0;
        }
        else
        {
            device.newly_found = false;
        }

        memcpy(&devices[slot], &device, sizeof(Device));
        slot++;
    }
}

int8_t DeviceManager::enumerateActuatorPins(uint8_t offset)
{
    switch (offset)
    {
    case 0:
        return ACTUATOR_PIN_1;
    case 1:
        return ACTUATOR_PIN_2;
    case 2:
        return ACTUATOR_PIN_3;
    case 3:
        return ShieldSpark::getInstance().isV2() ? ACTUATOR_PIN_4 : -1;
    default:
        return -1;
    }
}

void DeviceManager::getDevice(uint8_t &pin_nr, DeviceAddress &hw_address, Device &active)
{
    active.type = DEVICE_HARDWARE_NONE;
    active.value = 0;

    for (uint8_t i = 0; i < registered_devices; i++)
    {
        if (activeDevices[i].pin_nr == pin_nr && Helper::matchAddress(hw_address, activeDevices[i].hw_address, 8))
        {
            memcpy(&active, &activeDevices[i], sizeof(Device));
            break;
        }
    }
}

String DeviceManager::getDevicesJson()
{
    bool notFirst = false;
    String json = String("[");

    for (short i = 0; i < registered_devices; i++)
    {
        if (activeDevices[i].type != DEVICE_HARDWARE_NONE)
        {

            if (notFirst)
            {
                json.concat(',');
            }
            else
            {
                notFirst = true;
            }

            json.concat(getDeviceJson(activeDevices[i].pin_nr, activeDevices[i].hw_address, activeDevices[i].type));
        }
    }

    json.concat("]");

    return json;
}

String DeviceManager::getDeviceJson(uint8_t &pin_nr, DeviceAddress &hw_address, DeviceType type)
{
    char buf[17];
    String json = String("{");

    Helper::getBytes(hw_address, 8, buf);

    if (type != DEVICE_HARDWARE_NONE)
    {
        json.concat("\"type\":");
        json.concat(type);
        json.concat(",");
    }

    json.concat("\"pin_nr\":\"");
    json.concat(pin_nr);
    json.concat("\",\"hw_address\":\"");
    json.concat(buf);
    json.concat("\"}");

    return json;
}

String DeviceManager::getDeviceValuesJson()
{
    bool notFirst = false;
    char buf[17];
    String json = String("[");

    for (short i = 0; i < registered_devices; i++)
    {
        if (activeDevices[i].type != DEVICE_HARDWARE_NONE)
        {

            if (notFirst)
            {
                json.concat(',');
            }
            else
            {
                notFirst = true;
            }

            Helper::getBytes(activeDevices[i].hw_address, 8, buf);

            json.concat("{\"pin_nr\":\"");
            json.concat(activeDevices[i].pin_nr);
            json.concat("\",\"hw_address\":\"");
            json.concat(buf);
            json.concat("\",\"value\":");
            json.concat(activeDevices[i].value);
            json.concat('}');
        }
    }

    json.concat("]");

    return json;
}
