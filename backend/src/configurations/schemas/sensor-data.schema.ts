import { Types } from 'mongoose';

export class SensorData {
  _id?: Types.ObjectId;
  name: string;
  value: number;
}

export type ConfigurationSensorData = {
  [date: string]: SensorData[];
};

export type ConfigurationSensorDatas = {
  publishedAt: string;
  configurationId: number;
  sensorData: ConfigurationSensorData;
};

export type EventSensorData = {
  publishedAt: string;
  configurationId: number;
  sensorData: SensorData[];
};
