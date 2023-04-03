import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Configuration, ConfigurationDocument } from './schemas';

@Injectable()
export class ConfigurationsService {
  constructor(
    @InjectModel(Configuration.name)
    private configurationModel: Model<Configuration>,
  ) {}

  public async findAll(archived: boolean): Promise<ConfigurationDocument[]> {
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
}
