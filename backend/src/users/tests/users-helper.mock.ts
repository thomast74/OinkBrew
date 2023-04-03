import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import { authenticator } from 'otplib';

import { AuthDto } from '../../auth/dtos';
import { ARGON_OPTIONS } from '../../constants';
import { User, UserDocument } from '../schemas';

export const userDto = {
  email: 'test@user.de',
  password: '12345',
} as AuthDto;

export async function createUser(otpConfirmed): Promise<User> {
  const hash = await argon2.hash(userDto.password, ARGON_OPTIONS);
  const otpSecret = authenticator.generateSecret();

  return {
    email: userDto.email,
    hash,
    otpConfirmed,
    otpSecret,
  } as User;
}

export async function createUserFromAuthDto(
  user: AuthDto,
  refreshToken = 'rt',
  otpConfirmed = false,
  otpSecret?: string,
) {
  const hash = await argon2.hash(user.password, ARGON_OPTIONS);
  const hashedRt = await argon2.hash(refreshToken, ARGON_OPTIONS);
  otpSecret = otpSecret ?? authenticator.generateSecret();

  return {
    id: '3',
    email: userDto.email,
    hash,
    otpConfirmed,
    otpSecret,
    hashedRt,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function createUserInDb(
  userModel: Model<User>,
  otpConfirmed,
): Promise<UserDocument | null> {
  const newUser = await createUser(otpConfirmed);

  await new userModel(newUser).save();

  return await userModel.findOne({ email: userDto.email }).exec();
}
