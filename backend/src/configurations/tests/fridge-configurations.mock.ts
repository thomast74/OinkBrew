import { mockDeviceOnline } from '../../devices/tests/devices.mock';
import { ConnectedDeviceType } from '../../devices/types';
import { FridgeConfiguration } from '../schemas';
import { ConfigurationType } from '../types';

export const mockFridgeNotArchived: FridgeConfiguration = {
  id: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'ccc',
  type: ConfigurationType.FRIDGE,
  device: mockDeviceOnline,
  temperature: 65.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_PWM,
    pinNr: 17,
    hwAddress: '000000000000',
    connected: false,
    offset: 0,
    deviceOffset: 0,
  },
  coolActuator: {
    type: ConnectedDeviceType.ACTUATOR_PWM,
    pinNr: 18,
    hwAddress: '000000000000',
    connected: false,
    offset: 0,
    deviceOffset: 0,
  },
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '2A0000000000',
    connected: false,
    offset: 0,
    deviceOffset: 0,
  },
  heatingPeriod: 5000,
  coolingPeriod: 5000,
  coolingOnTime: 10000,
  coolingOffTime: 60000,
  p: 1,
  i: 2,
  d: 3,
  fanPwm: 0.0,
  archived: false,
  sensorData: new Map(),
};

export const expectedConfigurationFridgeNotArchived = {
  ...mockFridgeNotArchived,
  __v: expect.any(Number),
  _id: expect.any(String),
  device: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};
