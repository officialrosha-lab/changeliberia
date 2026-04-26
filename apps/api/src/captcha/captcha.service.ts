import { Injectable } from '@nestjs/common';
import { captchaVerificationsTotal } from '../metrics/prometheus.metrics';

type CaptchaVerificationResult = {
  success: boolean;
  score?: number;
  provider: string;
};

@Injectable()
export class CaptchaService {
  async verifyToken(
    token: string | undefined,
    remoteIp: string,
  ): Promise<CaptchaVerificationResult> {
    const provider = (process.env.CAPTCHA_PROVIDER ?? 'mock').toLowerCase();
    if (provider === 'turnstile') {
      return this.verifyTurnstile(token, remoteIp);
    }
    if (provider === 'hcaptcha') {
      return this.verifyHCaptcha(token, remoteIp);
    }
    const success = token === 'human-verified';
    captchaVerificationsTotal
      .labels('mock', success ? 'success' : 'failure')
      .inc();
    return {
      success,
      score: success ? 1 : 0,
      provider: 'mock',
    };
  }

  private async verifyTurnstile(
    token: string | undefined,
    remoteIp: string,
  ): Promise<CaptchaVerificationResult> {
    if (!token) {
      captchaVerificationsTotal.labels('turnstile', 'failure').inc();
      return { success: false, provider: 'turnstile', score: 0 };
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      captchaVerificationsTotal.labels('turnstile', 'failure').inc();
      return { success: false, provider: 'turnstile', score: 0 };
    }

    const body = new URLSearchParams({
      secret,
      response: token,
      remoteip: remoteIp,
    });

    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body,
      },
    );

    if (!res.ok) {
      captchaVerificationsTotal.labels('turnstile', 'failure').inc();
      return { success: false, provider: 'turnstile', score: 0 };
    }

    const json = (await res.json()) as { success?: boolean };
    const success = Boolean(json.success);
    captchaVerificationsTotal
      .labels('turnstile', success ? 'success' : 'failure')
      .inc();
    return {
      success,
      provider: 'turnstile',
      score: success ? 1 : 0,
    };
  }

  private async verifyHCaptcha(
    token: string | undefined,
    remoteIp: string,
  ): Promise<CaptchaVerificationResult> {
    if (!token) {
      captchaVerificationsTotal.labels('hcaptcha', 'failure').inc();
      return { success: false, provider: 'hcaptcha', score: 0 };
    }

    const secret = process.env.HCAPTCHA_SECRET_KEY;
    if (!secret) {
      captchaVerificationsTotal.labels('hcaptcha', 'failure').inc();
      return { success: false, provider: 'hcaptcha', score: 0 };
    }

    const body = new URLSearchParams({
      secret,
      response: token,
      remoteip: remoteIp,
    });

    const res = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!res.ok) {
      captchaVerificationsTotal.labels('hcaptcha', 'failure').inc();
      return { success: false, provider: 'hcaptcha', score: 0 };
    }

    const json = (await res.json()) as { success?: boolean };
    const success = Boolean(json.success);
    captchaVerificationsTotal
      .labels('hcaptcha', success ? 'success' : 'failure')
      .inc();
    return {
      success,
      provider: 'hcaptcha',
      score: success ? 1 : 0,
    };
  }
}
