import { Model } from 'mongoose';

import { Device } from '../../devices/schemas';
import { ConfigurationDto } from '../dtos';
import { Configuration, ConfigurationDocument } from '../schemas';
import { mockBrewNotArchived } from './brew-configurations.mock';
import { mockBrewArchived } from './brew-configurations.mock';
import { mockFridgeNotArchived } from './fridge-configurations.mock';

export async function createConfInDb(
  deviceModel: Model<Device>,
  configurationModel: Model<Configuration>,
  configuration: any,
): Promise<ConfigurationDocument | null> {
  const confToSave = {
    ...configuration,
  };

  let device = await deviceModel
    .findOne({ id: confToSave.device.id })
    .populate('configurations')
    .exec();
  if (!device) {
    await new deviceModel(confToSave.device).save();
    device = await deviceModel
      .findOne({ id: confToSave.device.id })
      .populate('configurations')
      .exec();
  }
  confToSave.device = device?._id;

  await new configurationModel(confToSave).save();
  const confDoc = await configurationModel.findOne({ id: confToSave.id }).exec();

  if (device?.configurations.findIndex((conf) => conf.id === confDoc!.id) == -1) {
    device?.configurations.push(confDoc!);
    await device?.save();
  } else {
    console.error('no conf');
  }

  return confDoc;
}

export async function createConfFromDto(
  deviceModel: Model<Device>,
  confModel: Model<Configuration>,
  configrationDto: ConfigurationDto,
) {
  const device = await deviceModel.findOne({ id: configrationDto.deviceId }).exec();
  const confToSave = configrationDto as any;
  confToSave.device = device;

  await new confModel(confToSave).save();

  return await confModel.findOne({ id: confToSave.id }).exec();
}

export async function createConfigurations(
  deviceModel: Model<Device>,
  confModel: Model<Configuration>,
) {
  await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
  await createConfInDb(deviceModel, confModel, mockBrewArchived);
  await createConfInDb(deviceModel, confModel, mockFridgeNotArchived);
}
