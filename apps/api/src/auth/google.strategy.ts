import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

/**
 * Google OAuth Strategy
 * Handles Google OAuth 2.0 authentication flow
 * Verifies Google tokens and creates/links user accounts
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
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
      // Get user info from Google profile
      const googleId = profile.id;
      const googleEmail = profile.emails?.[0]?.value;
      const fullName = profile.displayName;
      const avatarUrl = profile.photos?.[0]?.value;

      // Create or link user via AuthService
      const token = await this.authService.loginWithGoogle({
        googleId,
        googleEmail,
        fullName,
        avatarUrl,
      });

      done(null, token);
    } catch (error) {
      done(error);
    }
  }
}
