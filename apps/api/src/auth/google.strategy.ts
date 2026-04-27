import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  private static readonly logger = new Logger('GoogleStrategy');

  constructor(private authService: AuthService) {
    const clientID = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientID || !clientSecret) {
      GoogleStrategy.logger.warn(
        'GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET not set — Google OAuth will be unavailable.',
      );
      // Provide dummy values so the strategy constructs without throwing;
      // the /auth/google route will simply never be reached in production
      // without valid credentials configured.
      super({
        clientID: 'disabled',
        clientSecret: 'disabled',
        callbackURL: 'http://localhost:4000/api/v1/auth/google/callback',
        scope: ['profile', 'email'],
      });
      return;
    }

    super({
      clientID,
      clientSecret,
      callbackURL:
        process.env.GOOGLE_OAUTH_CALLBACK_URL ||
        'http://localhost:4000/api/v1/auth/google/callback',
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    try {
      const token = await this.authService.loginWithGoogle({
        googleId: profile.id,
        googleEmail: profile.emails?.[0]?.value,
        fullName: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value,
      });
      done(null, token);
    } catch (error) {
      done(error);
    }
  }
}
