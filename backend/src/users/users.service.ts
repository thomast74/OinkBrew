import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import { authenticator } from 'otplib';

import { AuthDto } from '../auth/dtos';
import { ARGON_OPTIONS } from '../constants';
import { UserAlreadyExists, UserNotFoundException } from './exceptions';
import { User, UserDocument } from './schemas';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(userDto: AuthDto): Promise<UserDocument> {
    const hash = await argon2.hash(userDto.password, ARGON_OPTIONS);
    const otpSecret = authenticator.generateSecret();

    const newUser = {
      email: userDto.email,
      hash,
      otpSecret,
    };
    const createdUser = new this.userModel(newUser);

    try {
      return await createdUser.save();
    } catch (error) {
      if (error.toString().includes('duplicate key error')) {
        throw new UserAlreadyExists();
      }

      throw new BadRequestException(error.code);
    }
  }

  async updateRefreshToken(
    userId: string,
    refreshToken?: string,
    confirmOtp?: boolean,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    user.hashedRt = refreshToken
      ? await argon2.hash(refreshToken, ARGON_OPTIONS)
      : undefined;

    if (confirmOtp) {
      user.otpConfirmed = true;
    }

    return await user.save();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findById(userId).exec();
    } catch (error) {
      return null;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findOne({ email }).exec();
    } catch (error) {
      return null;
    }
  }
}
