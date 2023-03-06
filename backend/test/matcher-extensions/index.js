import * as jest_ext_matchers from 'jest-extended';
import * as matchers from '../matchers';

const jestExpect = global.expect;

if (jestExpect !== undefined) {
  jestExpect.extend(matchers);
  jestExpect.extend(jest_ext_matchers);
} else {
  throw new Error(
    "Unable to find Jest's global expect. " +
      'Please check you have added jest-extended correctly to your jest configuration. ',
  );
}
