import { Injectable, Logger } from '@nestjs/common';
import { Device } from '@prisma/client';
import { parseJSON } from 'date-fns';
import * as Particle from 'particle-api-js';
import {
  catchError,
  firstValueFrom,
  from,
  map,
  Observable,
  of,
  ReplaySubject,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { EventData } from 'src/devices/types';
import { TokenInfo } from './types';

@Injectable()
export class ParticleService {
  private readonly logger = new Logger(ParticleService.name);

  private particle: Particle;
  private tokenInfo = new ReplaySubject<TokenInfo>(1);
  private eventStreamSubsription = false;
  private events = new Subject<EventData>();

  constructor() {
    this.init();
    this.login();
  }

  private init() {
    this.logger.log('Init Particle SDK');
    this.particle = new Particle({
      clientId: process.env.PARTICLE_CLIENT_ID,
      clientSecret: process.env.PARTICLE_CLIENT_SECRET,
    });
  }

  private login() {
    this.logger.log('Login to Particle Cloud');
    this.particle
      .loginAsClientOwner({ headers: {}, context: undefined })
      .then((data) => {
        this.logger.log('Successfully logged in');
        this.tokenInfo.next(data.body);
      })
      .catch((error) => {
        this.logger.error('Could not log in', error);
        this.tokenInfo.next({} as TokenInfo);
      });
  }

  public listDevices(): Promise<Device[]> {
    const $source = this.tokenInfo.pipe(
      tap(() => this.logger.debug('Get devices')),
      switchMap((tokens: any) =>
        from(this.particle.listDevices({ auth: tokens.access_token })),
      ),
      map((response: any) =>
        response?.body ? (response.body as Device[]) : [],
      ),
      catchError((error) => {
        this.logger.error('Could not get devices', error);
        return of([]);
      }),
      tap({
        next: (devices) =>
          this.logger.debug(
            `Retrieved ${devices.length} devices from Particle Cloud`,
          ),
      }),
    );

    return firstValueFrom($source);
  }

  public getVariable(deviceId: string, name: string): Promise<any> {
    const $source = this.tokenInfo.pipe(
      tap(() => this.logger.debug('Get devices')),
      switchMap((tokens: any) =>
        from(
          this.particle.getVariable({
            deviceId,
            name,
            auth: tokens.access_token,
          }),
        ),
      ),
      map((response: any) =>
        response?.body?.result ? (response.body.result as any) : '',
      ),
      catchError((error) => {
        this.logger.error(`Could not get variable ${name}`, error);
        return of('');
      }),
      tap({
        next: (value) =>
          this.logger.debug(
            `Retrieved variable ${name} from device ${deviceId}: ${value}`,
          ),
      }),
    );

    return firstValueFrom($source);
  }

  public eventStream(): Observable<EventData> {
    this.startEventStreamListener();

    return this.events.asObservable();
  }

  private startEventStreamListener() {
    if (this.eventStreamSubsription) {
      return;
    }

    this.eventStreamSubsription = true;
    this.tokenInfo
      .pipe(
        tap(() => this.logger.log('Start listening to particle cloud events')),
        switchMap((tokens: any) =>
          from(
            this.particle.getEventStream({
              deviceId: 'mine',
              name: 'oinkbrew',
              auth: tokens.access_token,
            }),
          ),
        ),
      )
      .subscribe({
        next: (stream: any) => {
          stream.on('event', (data: any) => {
            const event = {
              ...data,
              published_at: parseJSON(data.published_at),
            };
            this.events.next(event);
          });
        },
        error: (error) => {
          this.logger.error(`startEventStreamListener`, error);
          this.eventStreamSubsription = false;
          this.events.error(error);
        },
      });
  }
}
