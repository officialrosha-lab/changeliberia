import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpProvider {
  private readonly otpStore = new Map<string, string>();

  sendOtp(phone: string): void {
    const code = '123456';
    this.otpStore.set(phone, code);
  }

  verifyOtp(phone: string, code: string): boolean {
    return this.otpStore.get(phone) === code;
  }
}
