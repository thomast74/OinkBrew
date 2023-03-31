import { ConnectedDeviceType, Device, User } from '@prisma/client';
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
