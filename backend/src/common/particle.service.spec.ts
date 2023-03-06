import { Test, TestingModule } from '@nestjs/testing';
import { parseJSON } from 'date-fns';
import * as Particle from 'particle-api-js';
import { ParticleService } from './particle.service';

describe('ParticleService', () => {
  let testModule: TestingModule;
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };

    process.env.PARTICLE_CLIENT_ID = 'my_client_id';
    process.env.PARTICLE_CLIENT_SECRET = 'my_client_secret';
  });

  afterEach(() => {
    process.env = env;
  });

  beforeEach(async () => {
    testModule = await Test.createTestingModule({
      providers: [ParticleService],
    }).compile();
  });

  describe('init', () => {
    it('should init particle with clientId and clientSecret', () => {
      testModule.get<ParticleService>(ParticleService);

      expect(Particle?.mockConstructorOptions?.clientId).toEqual(
        'my_client_id',
      );
      expect(Particle?.mockConstructorOptions?.clientSecret).toEqual(
        'my_client_secret',
      );
    });

    it('should immediatelly loginAsClientOwner', () => {
      testModule.get<ParticleService>(ParticleService);

      expect(Particle?.mockLoginAsClientOwner).toHaveBeenCalledWith({
        headers: {},
        context: undefined,
      });
    });
  });

  describe('listDevices', () => {
    it('should list devices from particle cloud', async () => {
      const testSubject = testModule.get<ParticleService>(ParticleService);

      await testSubject.listDevices();

      expect(Particle?.mockListDevices).toHaveBeenCalledWith({
        auth: '123456',
      });
    });

    it('should return devices retrieved in body', async () => {
      Particle.mockListDevices.mockResolvedValue({
        body: [{ name: 'control-box' }, { name: 'fridge-box' }],
      });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const devices = await testSubject.listDevices();

      expect(devices).toHaveLength(2);
    });

    it('should return no devices in case of api error', async () => {
      Particle.mockListDevices.mockRejectedValue('api error');
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const devices = await testSubject.listDevices();

      expect(devices).toHaveLength(0);
    });

    it('should return no devices in case of map error 1', async () => {
      Particle.mockListDevices.mockResolvedValue({});
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const devices = await testSubject.listDevices();

      expect(devices).toHaveLength(0);
    });

    it('should return no devices in case of map error 2', async () => {
      Particle.mockListDevices.mockResolvedValue(undefined);
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const devices = await testSubject.listDevices();

      expect(devices).toHaveLength(0);
    });
  });

  describe('updateDevice', () => {
    it('should update device name and notes to particle io', async () => {
      Particle.mockUpdateDevice.mockResolvedValue({ body: '' });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      await testSubject.updateDevice('aaa', 'new name', 'my notes');

      expect(Particle.mockUpdateDevice).toHaveBeenCalledWith({
        auth: '123456',
        deviceId: 'aaa',
        name: 'new name',
        notes: 'my notes',
      });
    });

    it('should return update response with isSuccessful true', async () => {
      Particle.mockUpdateDevice.mockResolvedValue({});
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const response = await testSubject.updateDevice(
        'aaa',
        'new name',
        'my notes',
      );

      expect(response.isSuccessful).toBe(true);
    });

    it('should return update response with isSuccessful false and error returned', async () => {
      Particle.mockUpdateDevice.mockRejectedValue({
        statusCode: 403,
        body: { info: 'Device update error' },
      });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const response = await testSubject.updateDevice(
        'aaa',
        'new name',
        'my notes',
      );

      expect(response.isSuccessful).toBe(false);
      expect(response.errorCode).toBe(403);
      expect(response.info).toBe('Device update error');
    });
  });

  describe('updateConnectedDeviceOffset', () => {
    it('should send new offset to device', async () => {
      const testSubject = testModule.get<ParticleService>(ParticleService);

      await testSubject.updateConnectedDeviceOffset('aaa', 17, '00000000', 0.7);

      expect(Particle.mockCallFunction).toHaveBeenCalledWith({
        auth: '123456',
        deviceId: 'aaa',
        name: 'setConfig',
        argument: JSON.stringify({
          command: 1,
          data: {
            pinNr: 17,
            hwAddress: '00000000',
            offset: 0.7,
          },
        }),
      });
    });

    it('should return UpdateResponse with isSuccessful false and error code', async () => {
      Particle.mockCallFunction.mockRejectedValue({
        statusCode: 403,
        body: { info: 'Device not found' },
      });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const updateResponse = await testSubject.updateConnectedDeviceOffset(
        'aaa',
        17,
        '00000000',
        0.7,
      );

      expect(updateResponse).toEqual({
        isSuccessful: false,
        errorCode: 403,
        info: 'Device not found',
      });
    });

    it('should return UpdateResponse with isSuccessful true', async () => {
      Particle.mockCallFunction.mockResolvedValue({});
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const updateResponse = await testSubject.updateConnectedDeviceOffset(
        'aaa',
        17,
        '00000000',
        0.7,
      );

      expect(updateResponse).toEqual({
        isSuccessful: true,
      });
    });
  });

  describe('getVariable', () => {
    it('should call particle service with deviceId, name and auth token', async () => {
      Particle.mockGetVariable.mockResolvedValue({
        body: { result: '' },
      });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      await testSubject.getVariable('aaa', 'bbb');

      expect(Particle.mockGetVariable).toHaveBeenCalledWith({
        deviceId: 'aaa',
        name: 'bbb',
        auth: '123456',
      });
    });

    it('should should return empty string in case Particle returns error', async () => {
      Particle.mockGetVariable.mockRejectedValue('bad error');
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const value = await testSubject.getVariable('aaa', 'bbb');

      expect(value).toEqual('');
    });

    it('should should return empty string in case empty response', async () => {
      Particle.mockGetVariable.mockResolvedValue(undefined);
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const value = await testSubject.getVariable('aaa', 'bbb');

      expect(value).toEqual('');
    });

    it('should should return value as string', async () => {
      Particle.mockGetVariable.mockResolvedValue({
        body: { result: 'fff' },
      });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const value = await testSubject.getVariable('aaa', 'bbb');

      expect(value).toEqual('fff');
    });

    it('should should return value as is', async () => {
      Particle.mockGetVariable.mockResolvedValue({
        body: { result: { key: 'fff' } },
      });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const value = await testSubject.getVariable('aaa', 'bbb');

      expect(value).toEqual({ key: 'fff' });
    });
  });

  describe('restart', () => {
    it('should send restart request to device', async () => {
      const testSubject = testModule.get<ParticleService>(ParticleService);

      await testSubject.restart('aaa');

      expect(Particle.mockCallFunction).toHaveBeenCalledWith({
        auth: '123456',
        deviceId: 'aaa',
        name: 'setConfig',
        argument: JSON.stringify({
          command: 4,
          data: {},
        }),
      });
    });

    it('should return UpdateResponse with isSuccessful false and error code', async () => {
      Particle.mockCallFunction.mockRejectedValue({
        statusCode: 403,
        body: { info: 'Device not found' },
      });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const updateResponse = await testSubject.restart('aaa');

      expect(updateResponse).toEqual({
        isSuccessful: false,
        errorCode: 403,
        info: 'Device not found',
      });
    });

    it('should return UpdateResponse with isSuccessful true', async () => {
      Particle.mockCallFunction.mockResolvedValue({});
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const updateResponse = await testSubject.restart('aaa');

      expect(updateResponse).toEqual({
        isSuccessful: true,
      });
    });
  });

  describe('eventStream', () => {
    it('should start listening for particle events', () => {
      const testSubject = testModule.get<ParticleService>(ParticleService);

      testSubject.eventStream().subscribe();

      expect(Particle.mockGetEventStream).toBeCalledWith({
        deviceId: 'mine',
        name: 'oinkbrew',
        auth: '123456',
      });
    });

    it('should only start listening to particle events once', async () => {
      Particle.mockGetEventStream.mockClear();
      const testSubject = testModule.get<ParticleService>(ParticleService);

      testSubject.eventStream().subscribe();
      testSubject.eventStream().subscribe();

      expect(Particle.mockGetEventStream).toHaveBeenCalledTimes(1);
    });

    it('should send new particle events to event stream', async () => {
      let receivedEventData;
      const testSubject = testModule.get<ParticleService>(ParticleService);

      testSubject.eventStream().subscribe({
        next: (data) => {
          receivedEventData = data;
        },
      });
      await new Promise(setImmediate);
      Particle.mockStreamResponse(sendEventData);

      expect(receivedEventData).toEqual(expectedEventData);
    });

    it('should send error to event stream in case particle event failed', async () => {
      let receivedError;
      Particle.mockGetEventStream.mockRejectedValue('This is an error');
      const testSubject = testModule.get<ParticleService>(ParticleService);

      testSubject.eventStream().subscribe({
        error: (error) => {
          receivedError = error;
        },
      });
      await new Promise(setImmediate);

      expect(receivedError).not.toBeUndefined();
    });
  });
});

const sendEventData = {
  data: 'true',
  ttl: 60,
  published_at: '2022-12-09T09:34:31.936Z',
  coreid: '3b003d000747343232363230',
  name: 'oinkbrew/start',
};
const expectedEventData = {
  data: 'true',
  ttl: 60,
  published_at: parseJSON('2022-12-09T09:34:31.936Z'),
  coreid: '3b003d000747343232363230',
  name: 'oinkbrew/start',
};
