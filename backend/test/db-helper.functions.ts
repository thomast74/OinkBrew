import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { ARGON_OPTIONS } from '../src/constants';
import { PrismaService } from '../src/prisma/prisma.service';
import { User } from '../src/users/types';
import { userDto } from './helper.functions';

export async function createUser(
  prisma: PrismaService,
  otpConfirmed = false,
): Promise<User | null> {
  const hash = await argon2.hash(userDto.password, ARGON_OPTIONS);
  const otpSecret = authenticator.generateSecret();

  const user = await prisma.client.user.create({
    data: {
      email: userDto.email,
      hash,
      otpConfirmed,
      otpSecret,
    },
  });

  return user;
}

export async function updateUser(
  prisma: PrismaService,
  userId?: number,
  data?: any,
): Promise<void> {
  if (!userId) {
    return;
  }

  await prisma.client.user.update({
    where: {
      id: userId,
    },
    data,
  });
}

export async function findUserByEmail(
  prisma: PrismaService,
  email: string,
): Promise<User | null> {
  const user = await prisma.client.user.findUnique({
    where: {
      email,
    },
  });

  return user;
}
