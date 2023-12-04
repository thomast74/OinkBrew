import { ObjectId } from 'mongoose';

export class SensorData {
  _id?: ObjectId;
  name: string;
  value: number;
}
