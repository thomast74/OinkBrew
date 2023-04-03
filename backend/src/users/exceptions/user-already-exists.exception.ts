import { BadRequestException } from '@nestjs/common';

export class UserAlreadyExists extends BadRequestException {
  constructor() {
    super('User already exists');
  }
}
