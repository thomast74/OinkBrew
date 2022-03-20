#ifndef OINKBREW_DEVICES_DEVICEMANAGER_H_
#define OINKBREW_DEVICES_DEVICEMANAGER_H_

#include "Device.h"
#include "spark_wiring_tcpclient.h"

#define INVALID_TEMP -127.00000

const short MAX_DEVICES = 16;

struct DeviceRequest
{
    uint8_t pin_nr;
    DeviceAddress hw_address;
    float offset;
};

class DeviceManager
{
private:
    Device activeDevices[MAX_DEVICES] = {};
    short registered_devices = 0;
    DeviceManager();

public:
    static DeviceManager &getInstance()
    {
        static DeviceManager instance;
        return instance;
    }

    void setupVariable();
    void init();
    bool findNewDevices();
    void readValues();

    void getDevice(uint8_t &pin_nr, DeviceAddress &hw_address, Device &active);
    bool removeDevice(uint8_t &pin_nr, DeviceAddress &hw_address, DeviceType &type);
    void clearDevices();

    void setOffset(DeviceRequest &deviceRequest);
    void setDeviceValue(uint8_t &pin_nr, DeviceAddress &hw_address, float value);

    String getDevicesJson();
    String getDeviceJson(uint8_t &pin_nr, DeviceAddress &hw_address, DeviceType type);
    String getDeviceValuesJson();

private:
    void processActuators(Device devices[], uint8_t &slot);
    void processOneWire(Device devices[], uint8_t &slot);

    int8_t enumerateActuatorPins(uint8_t offset);
};

#endif /* OINKBREW_DEVICES_DEVICEMANAGER_H_ */
