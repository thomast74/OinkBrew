import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon2 from 'argon2';
import { AuthDto } from '../auth/dtos';
import { Argon2Options } from '../constants';
import { PrismaService } from '../prisma/prisma.service';
import { User } from './types/user.type';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(userDto: AuthDto): Promise<User> {
    const hash = await argon2.hash(userDto.password, Argon2Options);

    const user = await this.prisma.user
      .create({
        data: {
          email: userDto.email,
          hash,
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
    refreshToken: string,
  ): Promise<void> {
    let hash = null;
    if (refreshToken) {
      hash = await argon2.hash(refreshToken, Argon2Options);
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: hash,
      },
    });
  }

  async findById(userId: number): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    return user as User;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    return user as User;
  }
}
