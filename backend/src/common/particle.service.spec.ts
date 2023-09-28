import { Test, TestingModule } from '@nestjs/testing';

import { parseJSON } from 'date-fns';
import { ParticleMock } from 'particle-api-js';

import { Configuration } from '../configurations/schemas';
import { mockBrewNotArchived } from '../configurations/tests/brew-configurations.mock';
import { mockDeviceOnline } from '../devices/tests/devices.mock';
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
    ParticleMock.mockCallFunction.mockClear();
    testModule = await Test.createTestingModule({
      providers: [ParticleService],
    }).compile();
  });

  describe('init', () => {
    it('should init particle with clientId and clientSecret', () => {
      testModule.get<ParticleService>(ParticleService);

      expect(ParticleMock.mockConstructorOptions().clientId).toEqual(
        'my_client_id',
      );
      expect(ParticleMock.mockConstructorOptions().clientSecret).toEqual(
        'my_client_secret',
      );
    });

    it('should immediatelly loginAsClientOwner', () => {
      testModule.get<ParticleService>(ParticleService);

      expect(ParticleMock.mockLoginAsClientOwner).toHaveBeenCalledWith({
        headers: {},
        context: undefined,
      });
    });
  });

  describe('listDevices', () => {
    it('should list devices from particle cloud', async () => {
      const testSubject = testModule.get<ParticleService>(ParticleService);

      await testSubject.listDevices();

      expect(ParticleMock.mockListDevices).toHaveBeenCalledWith({
        auth: '123456',
      });
    });

    it('should return devices retrieved in body', async () => {
      ParticleMock.mockListDevices.mockResolvedValue({
        body: [{ name: 'control-box' }, { name: 'fridge-box' }],
      });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const devices = await testSubject.listDevices();

      expect(devices).toHaveLength(2);
    });

    it('should return no devices in case of api error', async () => {
      ParticleMock.mockListDevices.mockRejectedValue('api error');
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const devices = await testSubject.listDevices();

      expect(devices).toHaveLength(0);
    });

    it('should return no devices in case of map error 1', async () => {
      ParticleMock.mockListDevices.mockResolvedValue({});
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const devices = await testSubject.listDevices();

      expect(devices).toHaveLength(0);
    });

    it('should return no devices in case of map error 2', async () => {
      ParticleMock.mockListDevices.mockResolvedValue(undefined);
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const devices = await testSubject.listDevices();

      expect(devices).toHaveLength(0);
    });
  });

  describe('updateDevice', () => {
    it('should update device name and notes to particle io', async () => {
      ParticleMock.mockUpdateDevice.mockResolvedValue({ body: '' });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      await testSubject.updateDevice('aaa', 'new name', 'my notes');

      expect(ParticleMock.mockUpdateDevice).toHaveBeenCalledWith({
        auth: '123456',
        deviceId: 'aaa',
        name: 'new name',
        notes: 'my notes',
      });
    });

    it('should return update response with isSuccessful true', async () => {
      ParticleMock.mockUpdateDevice.mockResolvedValue({});
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const response = await testSubject.updateDevice(
        'aaa',
        'new name',
        'my notes',
      );

      expect(response.isSuccessful).toBe(true);
    });

    it('should return update response with isSuccessful false and error returned', async () => {
      ParticleMock.mockUpdateDevice.mockRejectedValue({
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
      ParticleMock.mockCallFunction.mockResolvedValue({ body: {} });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      await testSubject.updateConnectedDeviceOffset('aaa', 17, '00000000', 0.7);

      expect(ParticleMock.mockCallFunction).toHaveBeenCalledWith({
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
      ParticleMock.mockCallFunction.mockRejectedValue({
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
      ParticleMock.mockCallFunction.mockResolvedValue({});
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
      ParticleMock.mockGetVariable.mockResolvedValue({
        body: { result: '' },
      });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      await testSubject.getVariable('aaa', 'bbb');

      expect(ParticleMock.mockGetVariable).toHaveBeenCalledWith({
        deviceId: 'aaa',
        name: 'bbb',
        auth: '123456',
      });
    });

    it('should should return empty string in case Particle returns error', async () => {
      ParticleMock.mockGetVariable.mockRejectedValue('bad error');
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const value = await testSubject.getVariable('aaa', 'bbb');

      expect(value).toEqual('');
    });

    it('should should return empty string in case empty response', async () => {
      ParticleMock.mockGetVariable.mockResolvedValue(undefined);
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const value = await testSubject.getVariable('aaa', 'bbb');

      expect(value).toEqual('');
    });

    it('should should return value as string', async () => {
      ParticleMock.mockGetVariable.mockResolvedValue({
        body: { result: 'fff' },
      });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const value = await testSubject.getVariable('aaa', 'bbb');

      expect(value).toEqual('fff');
    });

    it('should should return value as is', async () => {
      ParticleMock.mockGetVariable.mockResolvedValue({
        body: { result: { key: 'fff' } },
      });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      const value = await testSubject.getVariable('aaa', 'bbb');

      expect(value).toEqual({ key: 'fff' });
    });
  });

  describe('sendConfiguration', () => {
    it('should send configuration to particle io', async () => {
      ParticleMock.mockCallFunction.mockResolvedValue({ body: '' });
      const testSubject = testModule.get<ParticleService>(ParticleService);
      const confToSend = { ...mockBrewNotArchived } as any;

      await testSubject.sendConfiguration(confToSend);

      delete confToSend.device;
      const data = {
        command: 2,
        data: confToSend,
      };
      expect(ParticleMock.mockCallFunction).toHaveBeenCalledWith({
        deviceId: 'ccc',
        name: 'setConfig',
        argument: JSON.stringify(data),
        auth: '123456',
      });
    });

    it('should return an error if update fails', async () => {
      ParticleMock.mockCallFunction.mockRejectedValue(
        new Error('bad api error'),
      );
      const testSubject = testModule.get<ParticleService>(ParticleService);
      const confToSend = { ...mockBrewNotArchived } as any;

      await expect(testSubject.sendConfiguration(confToSend)).rejects.toEqual(
        new Error('bad api error'),
      );
    });
  });

  describe('deleteConfiguration', () => {
    it('should send configuration to particle io', async () => {
      ParticleMock.mockCallFunction.mockResolvedValue({ body: '' });
      const testSubject = testModule.get<ParticleService>(ParticleService);
      const dataToSend = { id: 2 } as any;

      await testSubject.deleteConfiguration({
        id: 2,
        device: mockDeviceOnline,
      } as Configuration);

      const data = {
        command: 3,
        data: dataToSend,
      };
      expect(ParticleMock.mockCallFunction).toHaveBeenCalledWith({
        deviceId: 'ccc',
        name: 'setConfig',
        argument: JSON.stringify(data),
        auth: '123456',
      });
    });

    it('should return an error if update fails', async () => {
      ParticleMock.mockCallFunction.mockRejectedValue(
        new Error('bad api error'),
      );
      const testSubject = testModule.get<ParticleService>(ParticleService);

      await expect(
        testSubject.sendConfiguration({
          id: 2,
          device: mockDeviceOnline,
        } as Configuration),
      ).rejects.toEqual(new Error('bad api error'));
    });
  });

  describe('restart', () => {
    it('should send restart request to device', async () => {
      ParticleMock.mockCallFunction.mockResolvedValue({ body: {} });
      const testSubject = testModule.get<ParticleService>(ParticleService);

      await testSubject.restart('aaa');

      expect(ParticleMock.mockCallFunction).toHaveBeenCalledWith({
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
      ParticleMock.mockCallFunction.mockRejectedValue({
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
      ParticleMock.mockCallFunction.mockResolvedValue({});
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

      expect(ParticleMock.mockGetEventStream).toBeCalledWith({
        deviceId: 'mine',
        name: 'oinkbrew',
        auth: '123456',
      });
    });

    it('should only start listening to particle events once', async () => {
      ParticleMock.mockGetEventStream.mockClear();
      const testSubject = testModule.get<ParticleService>(ParticleService);

      testSubject.eventStream().subscribe();
      testSubject.eventStream().subscribe();

      expect(ParticleMock.mockGetEventStream).toHaveBeenCalledTimes(1);
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
      ParticleMock.mockStreamResponse(sendEventData);

      expect(receivedEventData).toEqual(expectedEventData);
    });

    it('should send error to event stream in case particle event failed', async () => {
      let receivedError;
      ParticleMock.mockGetEventStream.mockRejectedValue('This is an error');
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
