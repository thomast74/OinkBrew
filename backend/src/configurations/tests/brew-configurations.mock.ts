import { ConnectedDevice } from '../../devices/schemas';
import { mockDeviceOnline } from '../../devices/tests/devices.mock';
import { ConnectedDeviceType } from '../../devices/types';
import { BrewConfiguration } from '../schemas';
import { ConfigurationType } from '../types';

export const mockBrewNotArchived: BrewConfiguration = {
  type: ConfigurationType.BREW,
  id: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  device: mockDeviceOnline,
  name: 'aaa',
  temperature: 65.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_PWM,
    pinNr: 17,
    hwAddress: '000000000000',
    connected: false,
    name: undefined,
    offset: 0,
    deviceOffset: 0,
  },
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '2A0000000000',
    connected: false,
    name: undefined,
    offset: 0,
    deviceOffset: 0,
  },
  heatingPeriod: 5000,
  p: 1,
  i: 2,
  d: 3,
  pump1Actuator: undefined,
  pump2Actuator: undefined,
  heaterPwm: 0.0,
  pump1Pwm: 100.0,
  pump2Pwm: 100.0,
  archived: false,
};

export const mockBrewArchived: BrewConfiguration = {
  id: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'bbb',
  type: ConfigurationType.BREW,
  device: mockDeviceOnline,
  temperature: 65.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_PWM,
    pinNr: 17,
    hwAddress: '000000000000',
    connected: false,
    offset: 0,
    deviceOffset: 0,
  } as ConnectedDevice,
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '2A0000000000',
    connected: false,
    offset: 0,
    deviceOffset: 0,
  } as ConnectedDevice,
  heatingPeriod: 5000,
  p: 1,
  i: 2,
  d: 3,
  pump1Actuator: undefined,
  pump2Actuator: undefined,
  heaterPwm: 0.0,
  pump1Pwm: 100.0,
  pump2Pwm: 100.0,
  archived: true,
};

export const expectedConfigurationBrewNotArchived = {
  ...mockBrewNotArchived,
  __v: expect.any(Number),
  _id: expect.any(String),
  device: [expect.any(String)],
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

export const expectedConfigurationBrewArchived = {
  ...mockBrewArchived,
  __v: expect.any(Number),
  _id: expect.any(String),
  device: [expect.any(String)],
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};
