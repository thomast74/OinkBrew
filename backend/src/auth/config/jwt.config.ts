import { registerAs } from '@nestjs/config';

export default registerAs('jwt-config', () => ({
  accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
  accessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
  refreshTokenExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
}));
