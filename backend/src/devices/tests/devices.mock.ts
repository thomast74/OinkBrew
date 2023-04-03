import { ConnectedDevice, Device } from '../schemas';
import { ConnectedDeviceType } from '../types';

export const mockDeviceOnline: Device = {
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
  firmware_updates_enabled: true,
  firmware_updates_forced: false,
  status: '',
  serial_number: '',
  system_firmware_version: '',
  current_build_target: '',
  default_build_target: '',
  functions: [],
  variables: {},
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
  configuration: [],
};

export const mockDeviceOffline: Device = {
  id: 'ddd',
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
  firmware_updates_enabled: true,
  firmware_updates_forced: false,
  status: '',
  serial_number: '',
  system_firmware_version: '',
  current_build_target: '',
  default_build_target: '',
  functions: [],
  variables: {},
  connectedDevices: [],
  configuration: [],
};

export const mockDeviceOnlineWithConnectedDevice = {
  ...mockDeviceOnline,
  connectedDevices: [
    {
      type: ConnectedDeviceType.ACTUATOR_DIGITAL,
      pinNr: 18,
      hwAddress: '000000000000',
      name: undefined,
      offset: 0.0,
      deviceOffset: 0.0,
      connected: false,
    },
  ],
};

export const mockDeviceOfflineWithConnectedDevice = {
  ...mockDeviceOffline,
  connectedDevices: [
    {
      type: ConnectedDeviceType.ACTUATOR_DIGITAL,
      pinNr: 18,
      hwAddress: '000000000000',
      offset: 0.0,
      deviceOffset: 0.0,
      connected: false,
    },
  ],
};

export const mockDeviceOfflineWithConnectedDeviceConnected = {
  ...mockDeviceOffline,
  connectedDevices: [
    {
      type: ConnectedDeviceType.ACTUATOR_DIGITAL,
      pinNr: 18,
      hwAddress: '000000000000',
      name: undefined,
      offset: 0.0,
      deviceOffset: 0.0,
      connected: true,
    },
  ],
};

export const newConnectedDevice: ConnectedDevice = {
  type: ConnectedDeviceType.ACTUATOR_DIGITAL,
  pinNr: 11,
  hwAddress: '000000000000',
  offset: 0.0,
  deviceOffset: 0.0,
  connected: false,
};

const secondConnectedDevice: ConnectedDevice = {
  type: ConnectedDeviceType.ACTUATOR_DIGITAL,
  pinNr: 12,
  hwAddress: '000000000000',
  name: undefined,
  offset: 0.0,
  deviceOffset: 0.0,
  connected: false,
};

export const mockDeviceWithConnectedDevicesConnected = {
  id: 'bbb',
  connectedDevices: [
    { ...secondConnectedDevice },
    { ...newConnectedDevice, connected: true },
  ],
} as Device;

export const expectedDeviceDatabaseOffline = {
  ...mockDeviceOffline,
  __v: expect.any(Number),
  _id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  last_handshake_at: expect.any(String),
  last_heard: expect.any(String),
};

export const expectedDeviceDatabaseOnline = {
  ...mockDeviceOnline,
  __v: expect.any(Number),
  _id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  last_handshake_at: expect.any(String),
  last_heard: expect.any(String),
};

export const expectedDevice1 = {
  __v: expect.any(Number),
  _id: expect.any(String),
  cellular: false,
  configuration: [],
  connected: expect.any(Boolean),
  connectedDevices: expect.any(Array),
  createdAt: expect.any(String),
  current_build_target: '3.3.1',
  default_build_target: '2.3.1',
  firmware_updates_enabled: true,
  firmware_updates_forced: false,
  functions: ['setConfig'],
  id: '3b003d000747343232363230',
  last_handshake_at: expect.any(String),
  last_heard: expect.any(String),
  last_ip_address: expect.any(String),
  name: expect.any(String),
  notes: expect.toBeOneOf([undefined, null, expect.any(String)]),
  online: expect.any(Boolean),
  pinned_build_target: '2.1.0',
  platform_id: 6,
  product_id: 6,
  serial_number: 'PH-150624-K34T-0',
  status: 'normal',
  system_firmware_version: '3.3.1',
  updatedAt: expect.any(String),
  variables: {
    Configurations: 'string',
    Devices: 'string',
    ShieldVersion: 'int32',
    Version: 'string',
  },
};

export const expectedDevice2 = {
  __v: expect.any(Number),
  _id: expect.any(String),
  cellular: false,
  configuration: [],
  connected: expect.any(Boolean),
  connectedDevices: expect.any(Array),
  createdAt: expect.any(String),
  current_build_target: '2.1.0',
  default_build_target: '2.3.1',
  firmware_updates_enabled: true,
  firmware_updates_forced: false,
  functions: [],
  id: '280025000447343232363230',
  last_handshake_at: expect.any(String),
  last_heard: expect.any(String),
  last_ip_address: expect.any(String),
  name: expect.any(String),
  notes: expect.toBeOneOf([undefined, null, expect.any(String)]),
  online: expect.any(Boolean),
  platform_id: 6,
  product_id: 6,
  serial_number: 'PH-150623-YC2D-0',
  status: 'normal',
  system_firmware_version: '2.1.0',
  updatedAt: expect.any(String),
  variables: {},
};
