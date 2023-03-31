import { IsNotEmpty, IsString } from 'class-validator';

export class OtpDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  otpPassword: string;
}
