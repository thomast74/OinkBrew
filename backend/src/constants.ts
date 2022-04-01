import * as argon2 from 'argon2';

export const ARGON_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  salt: undefined,
};
