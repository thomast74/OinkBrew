import { ConnectedDevice } from '../schemas';

export class ConnectedDeviceHelper {
  static equals(cDevice1: ConnectedDevice, cDevice2: ConnectedDevice): boolean {
    if (!cDevice1 || !cDevice2) {
      return false;
    }

    return (
      cDevice1.type === cDevice2.type &&
      cDevice1.pinNr === cDevice2.pinNr &&
      cDevice1.hwAddress === cDevice2.hwAddress
    );
  }

  static parseData(data: any): ConnectedDevice {
    return {
      type: data.type,
      pinNr: data.pinNr,
      hwAddress: data.hwAddress,
      name: data.name ?? null,
      offset: data.offset ?? 0.0,
      deviceOffset: data.deviceOffset ?? 0.0,
      connected: data.connected ?? false,
    };
  }

  static parseArray(dataArray: any[]): ConnectedDevice[] {
    const cDevices: ConnectedDevice[] = [];

    dataArray.forEach((data) => {
      cDevices.push(ConnectedDeviceHelper.parseData(data));
    });

    return cDevices;
  }
}
