'use strict';

let initOptions = {};

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

var Particle = (function () {
  function Particle() {
    initOptions =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    console.error(initOptions);
  }

  Particle.prototype.loginAsClientOwner = loginAsClientOwner;
  Particle.prototype.listDevices = listDevices;
  Particle.prototype.updateDevice = updateDevice;
  Particle.prototype.callFunction = callFunction;
  Particle.prototype.getVariable = getVariable;
  Particle.prototype.getEventStream = getEventStream;

  return Particle;
})();

const ParticleMock = {
  mockConstructorOptions: function () {
    return initOptions;
  },
  mockLoginAsClientOwner: loginAsClientOwner,
  mockListDevices: listDevices,
  mockUpdateDevice: updateDevice,
  mockCallFunction: callFunction,
  mockGetVariable: getVariable,
  mockGetEventStream: getEventStream,
  mockStreamResponse: function (data) {
    if (streamResponse) {
      streamResponse(data);
    } else {
      console.error('stream response function not set');
    }
  },
};

export default Particle;
export { ParticleMock };
