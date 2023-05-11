import { mockDeviceWithConnectedDevicesConnected } from '../tests/devices.mock';
import { ConnectedDeviceHelper } from './connected-device.helper';

describe('findConnectedDeviceFromDevice', () => {
  it('should return connected device of device', () => {
    const cDevice = ConnectedDeviceHelper.findConnectedDeviceFromDevice(
      mockDeviceWithConnectedDevicesConnected,
      12,
      '000000000000',
    );

    expect(cDevice).toBeDefined();
  });

  it('should return null if connected device was not found', () => {
    const cDevice = ConnectedDeviceHelper.findConnectedDeviceFromDevice(
      mockDeviceWithConnectedDevicesConnected,
      2,
      '00000000',
    );

    expect(cDevice).toBeUndefined();
  });
});
