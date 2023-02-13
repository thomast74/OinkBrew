import { Device } from '@prisma/client';
import * as Particle from 'particle-api-js';

declare const process: any;

export async function getParticleDevice(deviceId: string): Promise<Device> {
  const particle = new Particle({
    clientId: process.env.PARTICLE_CLIENT_ID,
    clientSecret: process.env.PARTICLE_CLIENT_SECRET,
  });

  const tokenData = await particle.loginAsClientOwner({
    headers: {},
    context: undefined,
  });
  const access_token = tokenData.body.access_token;

  const deviceData = await particle.getDevice({
    auth: access_token,
    deviceId,
  });

  return deviceData.body;
}
