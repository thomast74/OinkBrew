let initOptions;

const loginAsClientOwner = jest.fn();
loginAsClientOwner.mockResolvedValue({
  body: {
    access_token: '123456',
  },
});

const listDevices = jest.fn();
listDevices.mockResolvedValue({ body: [] });

const updateDevice = jest.fn();
updateDevice.mockResolvedValue({ body: '' });

const callFunction = jest.fn();
callFunction.mockResolvedValue({});

const getVariable = jest.fn();
getVariable.mockResolvedValue({ body: '' });

let streamResponse = undefined;
const stream = {
  on: jest.fn(),
};
stream.on.mockImplementation((eventName, callback) => {
  streamResponse = callback;
});

const getEventStream = jest.fn();
getEventStream.mockResolvedValue(stream);

class Particle {
  constructor(options = {}) {
    initOptions = options;
  }

  static get mockConstructorOptions() {
    return initOptions;
  }

  static get mockLoginAsClientOwner() {
    return loginAsClientOwner;
  }

  static get mockListDevices() {
    return listDevices;
  }

  static get mockUpdateDevice() {
    return updateDevice;
  }

  static get mockCallFunction() {
    return callFunction;
  }

  static get mockGetVariable() {
    return getVariable;
  }

  static get mockGetEventStream() {
    return getEventStream;
  }

  static mockStreamResponse(data) {
    if (streamResponse) {
      streamResponse(data);
    } else {
      console.error('stream response function not set');
    }
  }
}

Particle.prototype.loginAsClientOwner = loginAsClientOwner;
Particle.prototype.listDevices = listDevices;
Particle.prototype.updateDevice = updateDevice;
Particle.prototype.callFunction = callFunction;
Particle.prototype.getVariable = getVariable;
Particle.prototype.getEventStream = getEventStream;

module.exports = Particle;
