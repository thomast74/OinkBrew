import { Prisma } from '@prisma/client';

export enum ConnectedDeviceType {
  DEVICE_HARDWARE_NONE = 0,
  DEVICE_HARDWARE_ACTUATOR_DIGITAL = 1, // digital pin, either on or off
  DEVICE_HARDWARE_ACTUATOR_PWM = 2, // analogue pin, used as PWM actuator
  DEVICE_HARDWARE_ONEWIRE_TEMP = 3,
}

export class ConnectedDevice {
  type: ConnectedDeviceType;
  pin_nr: string;
  hw_address: string;
  name?: string;
  connected: boolean;

  equals(cDevice: ConnectedDevice): boolean {
    return (
      cDevice.type === this.type &&
      cDevice.pin_nr === this.pin_nr &&
      cDevice.hw_address === this.hw_address
    );
  }

  private toJsonObject(): Prisma.JsonObject {
    const cDevice = {};

    Object.getOwnPropertyNames(this).forEach((property) => {
      if (typeof this[property] !== 'function') {
        cDevice[property] = this[property];
      }
    });

    return cDevice;
  }

  static toJsonArray(dataArray: ConnectedDevice[]): Prisma.JsonArray {
    const cDevices: Prisma.JsonArray = [];

    dataArray.forEach((cDevice) => {
      cDevices.push(cDevice.toJsonObject());
    });

    return cDevices;
  }

  static parseData(data: any): ConnectedDevice {
    const cDevice = new ConnectedDevice();

    cDevice.type = data.type;
    cDevice.pin_nr = data.pin_nr;
    cDevice.hw_address = data.hw_address;
    cDevice.name = data.name;
    cDevice.connected = data.connected;

    return cDevice;
  }

  static parseArray(dataArray: any[]): ConnectedDevice[] {
    const cDevices: ConnectedDevice[] = [];

    dataArray.forEach((data) => {
      cDevices.push(ConnectedDevice.parseData(data));
    });

    return cDevices;
  }
}
