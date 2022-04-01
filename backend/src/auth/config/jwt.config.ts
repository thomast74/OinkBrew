import { registerAs } from '@nestjs/config';

export default registerAs('jwt-config', () => ({
  otpTokenSecret: process.env.JWT_OTP_TOKEN_SECRET,
  otpTokenExpiration: process.env.JWT_OTP_TOKEN_EXPIRATION_TIME,
  accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
  accessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
  refreshTokenExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
}));
