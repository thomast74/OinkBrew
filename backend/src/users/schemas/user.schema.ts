import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  id: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  hash: string;

  @Prop()
  hashedRt?: string;

  @Prop({ default: false })
  otpConfirmed: boolean;

  @Prop()
  otpSecret: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.set('toObject', {
  virtuals: true,
});

UserSchema.set('toJSON', {
  virtuals: true,
});

UserSchema.pre('save', function (next) {
  if (this.isNew) {
    this.createdAt = new Date();
  }
  this.updatedAt = new Date();
  next();
});
