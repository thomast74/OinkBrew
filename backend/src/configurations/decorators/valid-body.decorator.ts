import { RawBody } from '../../common/decorators';
import { ConfigurationValidationPipe } from '../pipes';

export const ValidConfigurationBody = () =>
  RawBody(new ConfigurationValidationPipe());
