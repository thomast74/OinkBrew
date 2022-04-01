import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class OtpDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  otpPassword: string;
}
