export type User = {
  id: number;
  email: string;
  otpConfirmed: boolean;
  otpSecret: string;
  hash: string;
  hashedRt: string | null;
};
