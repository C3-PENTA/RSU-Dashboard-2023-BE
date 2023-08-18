import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/modules/users/service/users.service';
import { TokenPayload } from '../interface';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UsersService) {
    super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request) => request.cookies['accessToken'], // Extract the refresh token from the "refreshToken" cookie
			 ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_ACCESS_TOKEN,
    });
  }

  async validate(payload: TokenPayload) {
    const user = await this.userService.findOne(payload.username, 'username');
    return { username: user.username, role: user.role };
  }
}
