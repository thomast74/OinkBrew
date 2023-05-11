import { ConnectedDeviceType } from '../../devices/types';
import { ConfigurationType } from '../types';

export const confNotValid = {
  type: ConfigurationType.BREW,
  id: -1,
  name: 'brew conf',
  deviceId: 'ccc',
  temperature: -62.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_DIGITAL,
    pinNr: 14,
    hwAddress: '0000000000',
  },
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '23ae432344',
  },
  heatingPeriod: -2,
  p: 20.1,
  i: 0.5,
  d: 2.0,
  archived: false,
  heaterPwm: 8,
  pump1Pwn: 0.0,
  pump2Pwm: 0.0,
};

export const confOfBrewNotValid = {
  type: ConfigurationType.BREW,
  id: -1,
  name: 'brew conf',
  temperature: 62.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_DIGITAL,
    pinNr: 14,
    hwAddress: '0000000000',
  },
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '23ae432344',
  },
  // heatingPeriod: 5000,
  // p: 20.1,
  // i: 0.5,
  // d: 2.0,
  archived: false,
  heaterPwm: 0.8,
  pump1Pwn: 0.0,
  pump2Pwm: 0.0,
};

export const confOfFridgeNotValid = {
  type: ConfigurationType.FRIDGE,
  id: -1,
  name: 'fridge conf',
  temperature: 62.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_DIGITAL,
    pinNr: 14,
    hwAddress: '0000000000',
  },
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '23ae432344',
  },
  // heatingPeriod: 5000,
  // p: 20.1,
  // i: 0.5,
  // d: 2.0,
  archived: false,
  coolActuator: {
    type: ConnectedDeviceType.ACTUATOR_DIGITAL,
    pinNr: 15,
    hwAddress: '0000000000',
  },
  coolingPeriod: 20000,
  coolingOnTime: 30000,
  coolingOffTime: 50000,
};

export const brewConfNotValid = {
  type: ConfigurationType.BREW,
  id: -1,
  deviceId: 'xyz',
  name: 'brew conf',
  temperature: 62.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_DIGITAL,
    pinNr: 14,
    hwAddress: '0000000000',
  },
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '23ae432344',
  },
  heatingPeriod: 5000,
  p: 20.1,
  i: 0.5,
  d: 2.0,
  archived: false,
  heaterPwm: -0.8,
  pump1Pwn: 0.0,
  pump2Pwm: 0.0,
};

export const brewConfValid = {
  type: ConfigurationType.BREW,
  id: -1,
  deviceId: 'xyz',
  name: 'brew conf',
  temperature: 62.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_DIGITAL,
    pinNr: 14,
    hwAddress: '0000000000',
  },
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '23ae432344',
  },
  heatingPeriod: 5000,
  p: 20.1,
  i: 0.5,
  d: 2.0,
  archived: false,
  heaterPwm: 0.8,
  pump1Pwn: 0.0,
  pump2Pwm: 0.0,
};

export const fridgeConfNotValid = {
  type: ConfigurationType.FRIDGE,
  id: -1,
  deviceId: 'xyz',
  name: 'fridge conf',
  temperature: 62.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_DIGITAL,
    pinNr: 14,
    hwAddress: '0000000000',
  },
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '23ae432344',
  },
  heatingPeriod: 5000,
  p: 20.1,
  i: 0.5,
  d: 2.0,
  archived: false,
  coolActuator: {
    //type: ConnectedDeviceType.ACTUATOR_DIGITAL,
    pinNr: 15,
    hwAddress: '0000000000',
  },
  coolingPeriod: 20000,
  coolingOnTime: 30000,
  coolingOffTime: 50000,
};

export const fridgeConfValid = {
  type: ConfigurationType.FRIDGE,
  id: -1,
  deviceId: 'xyz',
  name: 'fridge conf',
  temperature: 62.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_DIGITAL,
    pinNr: 14,
    hwAddress: '0000000000',
  },
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '23ae432344',
  },
  heatingPeriod: 5000,
  p: 20.1,
  i: 0.5,
  d: 2.0,
  archived: false,
  coolActuator: {
    type: ConnectedDeviceType.ACTUATOR_DIGITAL,
    pinNr: 15,
    hwAddress: '0000000000',
  },
  coolingPeriod: 20000,
  coolingOnTime: 30000,
  coolingOffTime: 50000,
};
