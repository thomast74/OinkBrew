import { ObjectId } from 'mongoose';

export class SensorData {
  _id?: ObjectId;
  name: string;
  value: number;
}

export type EventSensorData = {
  publishedAt: string;
  configurationId: number;
  sensorData: SensorData[];
};
