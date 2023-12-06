import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAccessAuthGuard } from './auth/guards';
import { ConfigurationsModule } from './configurations/configurations.module';
import { DevicesModule } from './devices/devices.module';
import { ListenerModule } from './listener/listener.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
        password: process.env.REDIS_PWD,
      },
    }),
    MongooseModule.forRoot(process.env.DATABASE_URL ?? 'mongodb://localhost'),
    AuthModule,
    UsersModule,
    DevicesModule,
    ConfigurationsModule,
    ListenerModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAccessAuthGuard,
    },
  ],
})
export class AppModule {}
