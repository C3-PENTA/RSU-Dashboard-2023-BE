import {
  Controller,
  Post,
  Get,
  UseGuards,
  Body,
  Res,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { LocalAuthGuard } from '../guard/local-auth.guard';
import { AuthService } from '../service/auth.service';
import { SignUpDto } from '../dto/signUp.dto';
import { Response } from 'express';
import { SignInDto } from '../dto/signIn.dto';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtRefreshTokenGuard } from '../guard/jwt-refresh-token.guard';
import { JwtAccessTokenGuard } from '../guard/jwt-access-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Sign in to the application' })
  @ApiBody({
    description: 'Enter your credentials to sign in',
    type: SignInDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Login successful' })
  @UseGuards(LocalAuthGuard)
  @Post('sign-in')
  async signIn(@Request() req, @Res({ passthrough: true }) response: Response) {
    try {
      const token = await this.authService.signIn(req.user);
      const accessToken = token.accessToken;
      const refreshToken = token.refreshToken;
      response.cookie('accessToken', accessToken, {
        maxAge: 3600000 * 24, //1d
        httpOnly: false,
        secure: true,
      });
      response.cookie('refreshToken', refreshToken, {
        maxAge: 3600000 * 24 * 3, // 3 days
        httpOnly: false,
        secure: true,
      });
      return { message: 'Successful Authentication' };
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtRefreshTokenGuard)
  @Get('refresh')
  async refreshAccessToken(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const user = req.user;
      const payload = {
        username: user.username,
        email: user.email,
        role: user.role.name,
      };
      const accessToken = await this.authService.generateAccessToken(payload);
      response.cookie('accessToken', accessToken, {
        maxAge: 3600000 * 24, //1h
        httpOnly: false,
        secure: true,
      });
      return { message: 'Successful Authentication' };
    } catch (err) {
      throw err;
    }
  }

  @Post('sign-up')
  async signUp(@Body(new ValidationPipe()) signupDto: SignUpDto) {
    return this.authService.signUp(signupDto);
  }

  @UseGuards(JwtAccessTokenGuard)
  @Post('sign-out')
  async signOut(@Request() req, @Res({ passthrough: true }) res: Response) {
    const { user } = req;
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    await this.authService.signOut(user);
  }
}
