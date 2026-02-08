// Suppress console output except errors
const noop = () => {};
['log', 'info', 'warn', 'debug'].forEach((m) => {
  console[m] = noop;
});


const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
dotenv.config({ path: './.env.e2e', override: true });
