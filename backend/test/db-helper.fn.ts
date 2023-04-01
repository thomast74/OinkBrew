import {
  Configuration,
  ConfigurationType,
  ConnectedDevice,
  ConnectedDeviceType,
  Device,
  User,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { ARGON_OPTIONS } from '../src/constants';
import { PrismaService } from '../src/prisma/prisma.service';
import { userDto } from './helper.fn';

export async function createUser(
  prisma: PrismaService,
  otpConfirmed = false,
): Promise<User | null> {
  const hash = await argon2.hash(userDto.password, ARGON_OPTIONS);
  const otpSecret = authenticator.generateSecret();

  const user = await prisma.client.user.create({
    data: {
      email: userDto.email,
      hash,
      otpConfirmed,
      otpSecret,
    },
  });

  return user;
}

export async function updateUser(
  prisma: PrismaService,
  userId?: string,
  data?: any,
): Promise<void> {
  if (!userId) {
    return;
  }

  await prisma.client.user.update({
    where: {
      id: userId,
    },
    data,
  });
}

export async function findUserByEmail(
  prisma: PrismaService,
  email: string,
): Promise<User | null> {
  const user = await prisma.client.user.findUnique({
    where: {
      email,
    },
  });

  return user;
}

export async function findDeviceById(
  prisma: PrismaService,
  deviceId: string,
): Promise<Device | null> {
  const device = await prisma.client.device.findUnique({
    where: {
      id: deviceId,
    },
  });

  return device;
}

export const deviceMockInDatabaseOffline = {
  id: 'bbb',
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'Test Device',
  last_ip_address: '',
  last_heard: new Date(),
  last_handshake_at: new Date(),
  product_id: 1,
  online: false,
  connected: false,
  platform_id: 1,
  cellular: false,
  notes: null,
  firmware_updates_enabled: true,
  firmware_updates_forced: false,
  status: '',
  serial_number: '',
  system_firmware_version: '',
  current_build_target: '',
  pinned_build_target: null,
  default_build_target: '',
  functions: [],
  variables: {},
  shieldVersion: null,
  firmwareVersion: null,
  connectedDevices: [
    {
      type: ConnectedDeviceType.ACTUATOR_DIGITAL,
      pinNr: 8,
      hwAddress: '00000000',
      connected: false,
      name: 'new sensor name',
      offset: 0.8,
      deviceOffset: 0.0,
    },
  ],
};

export const deviceMockInDatabaseOfflineExpected = {
  ...deviceMockInDatabaseOffline,
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  last_handshake_at: expect.any(String),
  last_heard: expect.any(String),
};

export const deviceMockInDatabaseOnline = {
  id: 'ccc',
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'Test Device',
  last_ip_address: '',
  last_heard: new Date(),
  last_handshake_at: new Date(),
  product_id: 1,
  online: true,
  connected: false,
  platform_id: 1,
  cellular: false,
  notes: null,
  firmware_updates_enabled: true,
  firmware_updates_forced: false,
  status: '',
  serial_number: '',
  system_firmware_version: '',
  current_build_target: '',
  pinned_build_target: null,
  default_build_target: '',
  functions: [],
  variables: {},
  shieldVersion: null,
  firmwareVersion: null,
  connectedDevices: [
    {
      type: ConnectedDeviceType.ACTUATOR_DIGITAL,
      pinNr: 8,
      hwAddress: '00000000',
      name: 'new sensor name',
      offset: 0.8,
      deviceOffset: 0.0,
      connected: false,
    },
  ],
};

export const deviceMockInDatabaseOnlineExpected = {
  ...deviceMockInDatabaseOnline,
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  last_handshake_at: expect.any(String),
  last_heard: expect.any(String),
};

export async function createDevice(prisma: PrismaService) {
  await prisma.client.device.create({
    data: deviceMockInDatabaseOffline,
  });
  await prisma.client.device.create({
    data: deviceMockInDatabaseOnline,
  });
}

export const dbConfigurationBrew: Configuration = {
  id: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'aaa',
  type: ConfigurationType.BREW,
  temperature: 65.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_PWM,
    pinNr: 17,
    hwAddress: '000000000000',
    connected: false,
    name: null,
    offset: 0,
    deviceOffset: 0,
  } as ConnectedDevice,
  coolActuator: null,
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '2A0000000000',
    connected: false,
    name: null,
    offset: 0,
    deviceOffset: 0,
  } as ConnectedDevice,
  heatingPeriod: 5000,
  coolingPeriod: null,
  coolingOnTime: null,
  coolingOffTime: null,
  pid: {
    p: 1,
    i: 2,
    d: 3,
  },
  fanActuator: null,
  pump1Actuator: null,
  pump2Actuator: null,
  heaterPwm: null,
  fanPwm: null,
  pump1Pwm: 100.0,
  pump2Pwm: 100.0,
  archived: false,
};

export const dbConfigurationBrew2: Configuration = {
  id: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'aaa',
  type: ConfigurationType.BREW,
  temperature: 65.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_PWM,
    pinNr: 17,
    hwAddress: '000000000000',
    connected: false,
    name: null,
    offset: 0,
    deviceOffset: 0,
  } as ConnectedDevice,
  coolActuator: null,
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '2A0000000000',
    connected: false,
    name: null,
    offset: 0,
    deviceOffset: 0,
  } as ConnectedDevice,
  heatingPeriod: 5000,
  coolingPeriod: null,
  coolingOnTime: null,
  coolingOffTime: null,
  pid: {
    p: 1,
    i: 2,
    d: 3,
  },
  fanActuator: null,
  pump1Actuator: null,
  pump2Actuator: null,
  heaterPwm: null,
  fanPwm: null,
  pump1Pwm: 100.0,
  pump2Pwm: 100.0,
  archived: true,
};

export const dbConfigurationFridge: Configuration = {
  id: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'aaa',
  type: ConfigurationType.FRIDGE,
  temperature: 65.0,
  heatActuator: {
    type: ConnectedDeviceType.ACTUATOR_PWM,
    pinNr: 17,
    hwAddress: '000000000000',
    connected: false,
    name: null,
    offset: 0,
    deviceOffset: 0,
  },
  coolActuator: {
    type: ConnectedDeviceType.ACTUATOR_PWM,
    pinNr: 18,
    hwAddress: '000000000000',
    connected: false,
    name: null,
    offset: 0,
    deviceOffset: 0,
  } as ConnectedDevice,
  tempSensor: {
    type: ConnectedDeviceType.ONEWIRE_TEMP,
    pinNr: 0,
    hwAddress: '2A0000000000',
    connected: false,
    name: null,
    offset: 0,
    deviceOffset: 0,
  } as ConnectedDevice,
  heatingPeriod: 5000,
  coolingPeriod: 5000,
  coolingOnTime: 10000,
  coolingOffTime: 60000,
  pid: {
    p: 1,
    i: 2,
    d: 3,
  },
  fanActuator: null,
  pump1Actuator: null,
  pump2Actuator: null,
  heaterPwm: null,
  fanPwm: null,
  pump1Pwm: 100.0,
  pump2Pwm: 100.0,
  archived: false,
};

export const expectedConfigurationBrew = {
  ...dbConfigurationBrew,
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

export const expectedConfigurationBrew2 = {
  ...dbConfigurationBrew2,
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

export const expectedConfigurationFridge = {
  ...dbConfigurationFridge,
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

export async function createConfigurations(prisma: PrismaService) {
  await prisma.client.configuration.create({
    data: dbConfigurationBrew,
  });
  await prisma.client.configuration.create({
    data: dbConfigurationBrew2,
  });
  await prisma.client.configuration.create({
    data: dbConfigurationFridge,
  });
}
