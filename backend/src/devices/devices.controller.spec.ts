import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from './devices.controller';
import { DevicesModule } from './devices.module';

describe('DevicesController', () => {
  let module: TestingModule;
  let mockDevicesQueue;

  beforeEach(async () => {
    mockDevicesQueue = {
      add: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [DevicesModule],
    })
      .overrideProvider(getQueueToken('devices'))
      .useValue(mockDevicesQueue)
      .compile();
  });

  afterAll(async () => await module.close());

  describe('init', () => {
    it('should add queue devices.refresh', async () => {
      const _controller = module.get<DevicesController>(DevicesController);

      expect(mockDevicesQueue.add).toHaveBeenCalledTimes(1);
      expect(mockDevicesQueue.add).toHaveBeenCalledWith('refresh');
    });
  });
});
