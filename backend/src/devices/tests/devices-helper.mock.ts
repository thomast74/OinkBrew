import { Model } from 'mongoose';

import { Device, DeviceDocument } from '../schemas';
import { mockDeviceOffline, mockDeviceOnline } from './devices.mock';

export async function createDeviceInDb(
  deviceModel: Model<Device>,
  device: any,
): Promise<DeviceDocument | null> {
  const deviceToSave = {
    ...device,
  };

  await new deviceModel(deviceToSave).save();

  return await deviceModel.findOne({ id: deviceToSave.id }).exec();
}

export async function createDevices(deviceModel: Model<Device>) {
  await createDeviceInDb(deviceModel, mockDeviceOffline);
  await createDeviceInDb(deviceModel, mockDeviceOnline);
}
