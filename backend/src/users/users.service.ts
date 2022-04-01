import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { AuthDto } from '../auth/dtos';
import { ARGON_OPTIONS } from '../constants';
import { PrismaService } from '../prisma/prisma.service';
import { User } from './types/user.type';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(userDto: AuthDto): Promise<User> {
    const hash = await argon2.hash(userDto.password, ARGON_OPTIONS);
    const otpSecret = authenticator.generateSecret();

    const user = await this.prisma.client.user
      .create({
        data: {
          email: userDto.email,
          hash,
          otpSecret,
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ForbiddenException('Credentials incorrect');
          }
        }
        throw error;
      });

    return user as User;
  }

  async updateRefreshToken(
    userId: number,
    refreshToken?: string,
    confirmOtp?: boolean,
  ): Promise<void> {
    const data = {} as any;

    data.hashedRt = refreshToken
      ? await argon2.hash(refreshToken, ARGON_OPTIONS)
      : null;

    if (confirmOtp) {
      data.otpConfirmed = true;
    }

    await this.prisma.client.user.update({
      where: {
        id: userId,
      },
      data,
    });
  }

  async findById(userId: number): Promise<User | undefined> {
    try {
      const user = await this.prisma.client.user.findUnique({
        where: {
          id: userId,
        },
      });

      return user as User;
    } catch (error) {
      return undefined;
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await this.prisma.client.user.findUnique({
        where: {
          email: email,
        },
      });

      return user as User;
    } catch (error) {
      return undefined;
    }
  }
}
