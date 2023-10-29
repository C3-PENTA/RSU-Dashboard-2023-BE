import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../service/auth.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'api-key') {
  constructor(private authService: AuthService) {
    super({ header: 'api-key', prefix: '' }, true, (apikey, done, ) => {
      const checkKey = this.authService.validateApiKey(apikey);
      if (!checkKey) {
        return done(false);
      }
      return done(null, true);
    });
  }
}