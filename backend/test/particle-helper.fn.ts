import * as Particle from 'particle-api-js';

import { ConnectedDeviceHelper } from '../src/devices/helpers';
import { ConnectedDevice, Device } from '../src/devices/schemas';

declare const process: any;
let particle: Particle;
let access_token: string;

async function loginToParticle(): Promise<string> {
  if (access_token) {
    return access_token;
  }

  particle = new Particle({
    clientId: process.env.PARTICLE_CLIENT_ID,
    clientSecret: process.env.PARTICLE_CLIENT_SECRET,
  });

  const tokenData = await particle.loginAsClientOwner({
    headers: {},
    context: undefined,
  });

  access_token = tokenData.body.access_token;

  return access_token;
}

export async function getParticleDevice(deviceId: string): Promise<Device> {
  await loginToParticle();

  const deviceData = await particle.getDevice({
    auth: access_token,
    deviceId,
  });

  return deviceData.body;
}

export async function getParticleConnectedDevices(
  deviceId: string,
  pinNr: number,
  hwAddress: string,
): Promise<ConnectedDevice | undefined> {
  await loginToParticle();

  const response = await particle.getVariable({
    deviceId,
    name: 'Devices',
    auth: access_token,
  });

  const cDevices = ConnectedDeviceHelper.parseArray(
    JSON.parse(response.body.result),
  );
  const cDevice = findConnectedDevice(cDevices, pinNr, hwAddress);

  return cDevice;
}

function findConnectedDevice(
  cDevices: ConnectedDevice[],
  pinNr: number,
  hwAddress: string,
): ConnectedDevice | undefined {
  const connectedDevice = cDevices?.find(
    (cDevice) => cDevice.pinNr === pinNr && cDevice.hwAddress === hwAddress,
  );

  return connectedDevice;
}
