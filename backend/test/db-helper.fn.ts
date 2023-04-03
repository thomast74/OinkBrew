import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { ConnectionStates, Model } from 'mongoose';

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

const mongod = new MongoMemoryServer();

export async function connectDatabase() {
  if (mongod.state !== 'running' && mongod.state !== 'starting') {
    await mongod.start();
  } else {
    return;
  }

  const uri = await mongod.getUri();

  await mongoose.connect(uri);
}

export function getUserModel(): Model<User> {
  return mongoose.connection.model(User.name, UserSchema);
}

export function getDeviceModel(): Model<Device> {
  return mongoose.connection.model(Device.name, DeviceSchema);
}

export function getConfigurationModel(): Model<Configuration> {
  const confModel = mongoose.connection.model(
    Configuration.name,
    ConfigurationSchema,
  );
  confModel.discriminator(
    BrewConfiguration.name,
    BrewConfigurationSchema,
    ConfigurationType.BREW,
  );
  confModel.discriminator(
    FridgeConfiguration.name,
    FridgeConfigurationSchema,
    ConfigurationType.FRIDGE,
  );

  return confModel;
}

export async function clearDatabase() {
  if (mongoose.connection.readyState === ConnectionStates.disconnected) {
    await connectDatabase();
  }

  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
}

export async function clearDatabaseCollections() {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.drop();
  }
}

export async function closeDatabase() {
  if (mongoose.connection.readyState === ConnectionStates.disconnected) {
    await connectDatabase();
  }

  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}

export async function connectDatabaseE2E() {
  await mongoose.connect(process.env.DATABASE_URL ?? '');
}

export async function closeDatabaseE2E() {
  if (mongoose.connection.readyState === ConnectionStates.disconnected) {
    await connectDatabase();
  }

  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}
