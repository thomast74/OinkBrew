import { BadRequestException } from '@nestjs/common';

import {
  brewConfNotValid,
  brewConfValid,
  confNotValid,
  confOfBrewNotValid,
  confOfFridgeNotValid,
  fridgeConfNotValid,
  fridgeConfValid,
} from '../tests/configuration-dto.mock';
import { ConfigurationValidationPipe } from './configuration-validation.pipe';

describe('ConfigurationValidationPipe', () => {
  it('should return BadRequestException if configuration data not valid', async () => {
    const pipe = new ConfigurationValidationPipe();

    await expect(pipe.transform(confNotValid)).rejects.toEqual(
      new BadRequestException('Bad Request Exception'),
    );
  });

  it('should return BadRequestException if brew configuration data not valid', async () => {
    const pipe = new ConfigurationValidationPipe();

    await expect(pipe.transform(confOfBrewNotValid)).rejects.toEqual(
      new BadRequestException('Bad Request Exception'),
    );
  });

  it('should return BadRequestException if fridge configuration data not valid', async () => {
    const pipe = new ConfigurationValidationPipe();

    await expect(pipe.transform(confOfFridgeNotValid)).rejects.toEqual(
      new BadRequestException('Bad Request Exception'),
    );
  });

  it('should return BadRequestException if brew data not valid', async () => {
    const pipe = new ConfigurationValidationPipe();

    await expect(pipe.transform(brewConfNotValid)).rejects.toEqual(
      new BadRequestException('Bad Request Exception'),
    );
  });

  it('should return BadRequestException if fridge data not valid', async () => {
    const pipe = new ConfigurationValidationPipe();

    await expect(pipe.transform(fridgeConfNotValid)).rejects.toEqual(
      new BadRequestException('Bad Request Exception'),
    );
  });

  it('should return value if valid brew configuration provided', async () => {
    const pipe = new ConfigurationValidationPipe();

    const recvValue = await pipe.transform(brewConfValid);

    expect(recvValue).toEqual(brewConfValid);
  });

  it('should return value if valid fridge configuration provided', async () => {
    const pipe = new ConfigurationValidationPipe();

    const recvValue = await pipe.transform(fridgeConfValid);

    expect(recvValue).toEqual(fridgeConfValid);
  });
});
