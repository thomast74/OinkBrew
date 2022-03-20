/******************************************************/
//       THIS IS A GENERATED FILE - DO NOT EDIT       //
/******************************************************/

#line 1 "/Users/thomast74/Projects/Brew-Particle/brewpi-brew/src/brewpi-brew.ino"
#include "Particle.h"
#include "Settings.h"
#include "config/ShieldSpark.h"
#include "devices/DeviceManager.h"
#include "controller/ControllerManager.h"
#include "devices/Buzzer.h"
#include "ConfigManager.h"

void setup();
void loop();
void processValues(unsigned long time);
void publishValues(unsigned long time);
void detectNewDevices(unsigned long time);
int receiveConfiguration(String funtionData);
void processCommand(ReceivedConfig config);
#line 9 "/Users/thomast74/Projects/Brew-Particle/brewpi-brew/src/brewpi-brew.ino"
SerialLogHandler logHandler;
Buzzer buzzer;
DeviceManager deviceManager = DeviceManager::getInstance();
ControllerManager controllerManager = ControllerManager::getInstance();

unsigned long lastRun = -1000;
unsigned long lastLog = 0;
unsigned long lastDetect = 0;

// setup() runs once, when the device is first turned on.
void setup()
{
  Particle.variable("Version", OINK_BREW_VERSION);
  ShieldSpark::getInstance().setupVariable();
  deviceManager.setupVariable();
  controllerManager.setupVariable();

  deviceManager.init();
  deviceManager.findNewDevices();

  Particle.function("setConfig", receiveConfiguration);

  delay(1000);
  bool published = Particle.publish("oinkbrew/start", "true");
  Log.info(String(published));

  buzzer.beep(1, 100);
}

void loop()
{
  unsigned long time = millis();

  processValues(time);
  controllerManager.update();
  publishValues(time);
  detectNewDevices(time);
}

void processValues(unsigned long time)
{
  if ((time - lastRun) >= DURATION_RUN)
  {
    lastRun = time;
    deviceManager.readValues();
    controllerManager.process();
  }
}

void publishValues(unsigned long time)
{
  if ((time - lastLog) >= DURATION_LOG)
  {
    lastLog = time;
    Particle.publish("oinkbrew/device/values", deviceManager.getDeviceValuesJson());
  }
}

void detectNewDevices(unsigned long time)
{
  if ((time - lastDetect) >= DURATION_DETECT)
  {
    lastDetect = time;
    deviceManager.findNewDevices();
  }
}

int receiveConfiguration(String funtionData)
{
  Log.info("New configuration received");

  ReceivedConfig config = ConfigManager::parse(funtionData);
  processCommand(config);

  return 0;
}

void processCommand(ReceivedConfig config)
{
  switch (config.command)
  {
  case Command::OFFSET:
  {
    DeviceRequest deviceRequest = ConfigManager::parseDeviceRequest(config.data);
    deviceManager.setOffset(deviceRequest);
    break;
  }
  case Command::UPDATE_CONFIGURATION:
  {
    ControllerConfiguration configuration = ConfigManager::parseControllerConfiguration(config.data);
    controllerManager.changeController(configuration);
    break;
  }
  case Command::REMOVE_CONFIGURATION:
  {
    ControllerConfiguration configuration = ConfigManager::parseControllerConfiguration(config.data);
    controllerManager.removeController(configuration.id);
    break;
  }
  case Command::RESTART:
    System.reset();
    break;
  }
}

// set offset for temp sensor
// DeviceRequest dr3;
// parseJson(&TcpListener::receiveDeviceRequest, &dr3);
// deviceManager.setOffset(dr3);

// add or update a current configuration
// ControllerConfiguration cr1;
// parseJson(&TcpListener::receiveConfiguration, &cr1);
// controllerManager.changeController(cr1);

// remove a configuration
// ControllerConfiguration cr2;
// parseJson(&TcpListener::receiveConfiguration, &cr2);
// controllerManager.removeController(cr2.id);
