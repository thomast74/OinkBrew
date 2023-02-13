/* eslint-disable @typescript-eslint/no-explicit-any */

interface CustomMatchers<R> {
  nullOrAny<T>(object: T): R;
}

declare namespace jest {
  // noinspection JSUnusedGlobalSymbols
  interface Matchers<R> {
    nullOrAny<T>(object: T): R;
  }

  // noinspection JSUnusedGlobalSymbols
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Expect extends CustomMatchers<any> {}

  // noinspection JSUnusedGlobalSymbols
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface InverseAsymmetricMatchers extends Expect {}
}

declare namespace Vi {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AsymmetricMatchersContaining extends CustomMatchers<any> {}
}
