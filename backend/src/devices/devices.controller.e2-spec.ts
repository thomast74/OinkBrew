import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('DeviceController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        disableErrorMessages: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwt = moduleFixture.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    // const deleteUsers = prisma.client.user.deleteMany();
    // await prisma.client.$transaction([deleteUsers]);
    // await prisma.client.$disconnect();
  });

  describe('signup', () => {});
});
