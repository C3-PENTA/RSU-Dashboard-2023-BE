import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../service/auth.service';
import { TokenPayload } from '../interface';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
	Strategy,
	'refresh_token',
) {
	constructor(
		private readonly authService: AuthService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request) => request.cookies['refreshToken'], // Extract the refresh token from the "refreshToken" cookie
			 ]),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET_REFRESH_TOKEN,
			passReqToCallback: true,
		});
	}

	async validate(request, payload: TokenPayload) {
		return await this.authService.verifyRefreshToken(
			payload.username,
			request.cookies['refreshToken']
		);
	}
}