import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';
import { Observable, Subject, filter } from 'rxjs';

import { ParticleService } from '../common/particle.service';
import { DevicesService } from '../devices/devices.service';
import { ConnectedDeviceHelper } from '../devices/helpers';
import { Device, DeviceDocument } from '../devices/schemas';
import { getErrorMessage } from '../helpers/error.converter';
import { ConfigurationDto, ConnectedDeviceDto } from './dtos';
import {
  Configuration,
  ConfigurationDocument,
  ConfigurationSensorData,
  EventSensorData,
} from './schemas';

@Injectable()
export class ConfigurationsService {
  private readonly logger = new Logger(ConfigurationsService.name);
  private events$ = new Subject<EventSensorData>();

  constructor(
    @InjectModel(Configuration.name) private configurationModel: Model<Configuration>,
    @InjectModel(Device.name) private deviceModel: Model<Device>,
    private device: DevicesService,
    private particle: ParticleService,
  ) {}

  async findAll(archived: boolean): Promise<ConfigurationDocument[]> {
    try {
      return await this.configurationModel
        .find({
          archived,
        })
        .exec();
    } catch (error) {
      return [];
    }
  }

  async findByDevice(deviceId: string): Promise<ConfigurationDocument[]> {
    try {
      const device = await this.deviceModel
        .findOne({ id: deviceId })
        .populate({ path: 'configurations' })
        .exec();
      if (!device) {
        return [];
      }

      const configurations = await this.configurationModel
        .find({
          device: device._id,
        })
        .populate({ path: 'device' })
        .exec();

      return configurations;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async findSensorData(configurationId: number): Promise<ConfigurationSensorData> {
    let configuration: Configuration | null;

    try {
      configuration = await this.configurationModel.findOne({ id: configurationId }).exec();
    } catch (error) {
      throw new InternalServerErrorException(getErrorMessage(error));
    }

    if (!configuration) {
      throw new NotFoundException('Configuration not found');
    }

    if (configuration.sensorData?.size > 0) {
      return Object.fromEntries(configuration.sensorData);
    }

    return {};
  }

  async save(configurationDto: ConfigurationDto): Promise<ConfigurationDocument> {
    const { deviceId, ...confDto } = configurationDto;

    const device = await this.device.findById(deviceId);
    this.validateConnectedDevices(configurationDto, device);

    const configuration = confDto as Configuration;
    configuration.device = device;

    if (!configuration.id) {
      configuration.id = await this.getNextId();
    }

    return this.saveDocument(configuration);
  }

  async saveDocument(configuration: Configuration): Promise<ConfigurationDocument> {
    try {
      const configurationDoc = await this.configurationModel
        .findOneAndUpdate({ id: configuration.id }, configuration, {
          new: true,
          upsert: true,
        })
        .populate('device')
        .exec();

      if (configurationDoc === null) {
        throw new InternalServerErrorException('Configuration not created');
      }

      let device = configurationDoc.device as DeviceDocument;
      if (device.configurations.findIndex((confs) => confs.id === configurationDoc.id) === -1) {
        device.configurations.push(configurationDoc);
        device = await device.save();
        configurationDoc.device = device;
      }
      device.depopulate('configurations');

      this.logger.debug(`Saved ${configurationDoc._id} to database`);

      await this.sendConfigurationToParticle(configurationDoc);

      return configurationDoc;
    } catch (error) {
      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }

  async update(id: number, configurationDto: ConfigurationDto): Promise<ConfigurationDocument> {
    await this.getConfigurationIfExist(id);

    configurationDto.id = id;

    return this.save(configurationDto);
  }

  async delete(id: number): Promise<void> {
    const configration = await this.getConfigurationIfExist(id);

    configration.archived = true;

    try {
      await this.configurationModel.updateOne({ id }, configration).exec();

      if (configration.device.online) {
        await this.particle.deleteConfiguration(configration);
      }
    } catch (error: any) {
      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }

  getEventSensorData(id: number): Observable<EventSensorData> {
    return this.events$.pipe(filter((event) => event.configurationId === id));
  }

  sendEventSensorData(newEvent: EventSensorData) {
    this.events$.next(newEvent);
  }

  private async getConfigurationIfExist(id: number): Promise<ConfigurationDocument> {
    try {
      const configurationDoc = await this.configurationModel
        .findOne({ id })
        .populate('device')
        .exec();

      if (configurationDoc !== null) {
        return configurationDoc;
      }
    } catch (error) {
      throw new InternalServerErrorException(getErrorMessage(error));
    }

    throw new NotFoundException('Configuration not found');
  }

  private validateConnectedDevices(configuration: ConfigurationDto, device: Device) {
    Object.keys(configuration)
      .filter((key) => key.endsWith('Actuator') || key.endsWith('Sensor'))
      .forEach((key) => {
        const connectedDeviceDto = configuration[key] as ConnectedDeviceDto;
        if (!connectedDeviceDto) {
          return;
        }

        if (
          !ConnectedDeviceHelper.findConnectedDeviceFromDevice(
            device,
            connectedDeviceDto.pinNr,
            connectedDeviceDto.hwAddress,
          )
        ) {
          throw new NotFoundException(
            `Connected Device not found: ${connectedDeviceDto.pinNr}/${connectedDeviceDto.hwAddress}`,
          );
        }
      });
  }

  private async getNextId(): Promise<number> {
    const maxId = await this.configurationModel
      .findOne()
      .sort({
        id: 'desc',
      })
      .select({ id: 1 })
      .exec();

    return maxId === null ? 1 : maxId.id;
  }

  private async sendConfigurationToParticle(configuration: ConfigurationDocument): Promise<void> {
    if (!configuration.device.online) {
      return;
    }

    await this.particle.sendConfiguration(configuration);
  }
}
