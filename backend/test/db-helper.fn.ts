import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Model } from 'mongoose';

import {
  BrewConfiguration,
  BrewConfigurationSchema,
  Configuration,
  ConfigurationSchema,
  FridgeConfiguration,
  FridgeConfigurationSchema,
} from '../src/configurations/schemas';
import { ConfigurationType } from '../src/configurations/types';
import { Device, DeviceSchema } from '../src/devices/schemas';
import { User, UserSchema } from '../src/users/schemas';

let mongod: MongoMemoryServer | undefined;

const defaultHasConnectedDevice = (pinNr: number, hwAddress: string) => {
  return pinNr === 0 && hwAddress === '28FF5C92711503AF';
};

export async function connectDatabase() {
  if (mongod === undefined) {
    mongod = await MongoMemoryServer.create();
  }

  if (mongod.state !== 'running' && mongod.state !== 'starting') {
    await mongod.start();
  }

  const uri = mongod.getUri();

  await mongoose.connect(uri);
}

export function getUserModel(): Model<User> {
  return mongoose.connection.model(User.name, UserSchema);
}

export function getDeviceModel(): Model<Device> {
  return mongoose.connection.model(Device.name, DeviceSchema);
}

export function getConfigurationModel(
  hasConnectedDevice: (pinNr: number, hwAddress: string) => boolean = defaultHasConnectedDevice,
): Model<Configuration> {
  const confModel = mongoose.connection.model(Configuration.name, ConfigurationSchema);
  confModel.discriminator(BrewConfiguration.name, BrewConfigurationSchema, ConfigurationType.BREW);
  confModel.discriminator(
    FridgeConfiguration.name,
    FridgeConfigurationSchema,
    ConfigurationType.FRIDGE,
  );

  confModel.schema.methods.hasConnectedDevice = hasConnectedDevice;

  return confModel;
}

export function getBrewConfigurationModel(): Model<BrewConfiguration> {
  return mongoose.connection.model<BrewConfiguration>(BrewConfiguration.name);
}

export function getFridgeConfigurationModel(): Model<FridgeConfiguration> {
  return mongoose.connection.model<FridgeConfiguration>(FridgeConfiguration.name);
}

export async function clearDatabase() {
  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }

  const collections = mongoose.connection.collections;

  for (const key in collections) {
    try {
      const collection = collections[key];
      await collection.deleteMany();
    } catch (error) {}
  }
}

export async function clearDatabaseCollections() {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.drop();
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (mongod !== undefined) {
    await mongod.stop();
    mongod = undefined;
  }
}

export async function closeDatabase() {
  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }

  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod?.stop();
  mongod = undefined;
}

export async function connectDatabaseE2E() {
  await mongoose.connect(process.env.DATABASE_URL ?? '');
}

export async function closeDatabaseE2E() {
  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }

  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}
