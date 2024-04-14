import { Types } from 'mongoose';

import { mockDeviceOnline, mockRealDeviceOnline } from '../../devices/tests/devices.mock';
import { ConnectedDeviceType } from '../../devices/types';
import { FridgeConfiguration, SensorData } from '../schemas';
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
    hwAddress: '28FF5C92711503AF',
    connected: true,
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

export const mockRealFridgeNotArchived: FridgeConfiguration = {
  id: 25,
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'real ccc',
  type: ConfigurationType.FRIDGE,
  device: mockRealDeviceOnline,
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
    hwAddress: '28FF5C92711503AF',
    connected: true,
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
  sensorData: {},
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

export const mapSensorData = new Map<string, SensorData[]>([
  ['2014-04-14T23:03:07', [{ _id: new Types.ObjectId(), name: '0/2F02928283', value: 23.65 }]],
  ['2014-04-14T23:03:17', [{ _id: new Types.ObjectId(), name: '0/2F02928283', value: 23.75 }]],
  ['2014-04-14T23:03:27', [{ _id: new Types.ObjectId(), name: '0/2F02928283', value: 23.55 }]],
]);

export const expectedSensorData = {
  '2014-04-14T23:03:07': [{ _id: expect.any(String), name: '0/2F02928283', value: 23.65 }],
  '2014-04-14T23:03:17': [{ _id: expect.any(String), name: '0/2F02928283', value: 23.75 }],
  '2014-04-14T23:03:27': [{ _id: expect.any(String), name: '0/2F02928283', value: 23.55 }],
};
