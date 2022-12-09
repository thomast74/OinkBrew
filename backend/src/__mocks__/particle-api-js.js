let initOptions;

const loginAsClientOwner = jest.fn();
loginAsClientOwner.mockResolvedValue({
  body: {
    access_token: '123456',
  },
});

const listDevices = jest.fn();
listDevices.mockResolvedValue({
  body: [],
});

const getVariable = jest.fn();
getVariable.mockResolvedValue({
  body: '',
});

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

  static get mockGetVariable() {
    return getVariable;
  }
}

Particle.prototype.loginAsClientOwner = loginAsClientOwner;
Particle.prototype.listDevices = listDevices;
Particle.prototype.getVariable = getVariable;

module.exports = Particle;
