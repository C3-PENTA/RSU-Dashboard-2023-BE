import { Injectable, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/service/users.service';
import { JwtService } from '@nestjs/jwt';
import { Users } from 'src/modules/users/entity/users.entity';
import * as bcrypt from 'bcrypt';
import { TokenPayload, UserInfo } from '../interface';
import * as crypto from 'crypto'
import * as path from 'path'
import * as fs from 'fs'
import { checkExistFolder } from '@util/function';

@Injectable()
export class AuthService {
  private saltOrRounds = 10;
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(username: string, pass: string): Promise<Users> {
    try {
      const user = await this.usersService.findOne(username, 'username');
      if (!user) {
        throw new UnauthorizedException();
      }
      await this.verifyHashedContent(pass, user.password);
      return user;
    } catch (err) {
      throw err;
    }
  }

  async signIn(user: any) {
    const payload = { username: user.username, email: user.email, role: user.role };
    const accessToken = await this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload);
    await this.storeRefreshToken(user.username, refreshToken);
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  private async verifyHashedContent(password: string, hashedPassword: string) {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      throw new BadRequestException();
    }
  }

  async signUp(userInfo: UserInfo) {
    try {
      const existed_user = await this.usersService.findOne(
        userInfo.username,
        'username',
      );

      if (existed_user) {
        throw new ConflictException('Username already existed!!');
      }

      const hashed_password = await bcrypt.hash(
        userInfo.password,
        this.saltOrRounds,
      );

      await this.usersService.create({
        ...userInfo,
        password: hashed_password,
      });
      return {
        message: "User Successfully Created"
      }
    } catch (error) {
      throw error;
    }
  }

  async signOut(user: TokenPayload) {
    await this.usersService.setCurrentRefreshToken(user.username, null);
    // await this.usersService.updateLastLogin(user.id);
  }

  async generateAccessToken(payload: TokenPayload) {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_ACCESS_TOKEN,
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME
    })
  }

  async generateRefreshToken(payload: TokenPayload) {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_REFRESH_TOKEN,
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME
    })
  }

  async decodeToken(token: string) {
    return this.jwtService.decode(token);
  }

  async generateKeyPair(nameKey: string) {
    const certFolderPath = path.join(__dirname, `../../../../cert`);
    checkExistFolder(certFolderPath);
    const privateKeyPath = `${certFolderPath}/${nameKey}_private.pem`;
    const publicKeyPath = `${certFolderPath}/${nameKey}_public.pem`;

    if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      fs.writeFileSync(privateKeyPath, privateKey);
      fs.writeFileSync(publicKeyPath, publicKey);
      return { privateKey, publicKey };
    }

    const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
    const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');

    return { privateKey, publicKey };
  }

  async storeRefreshToken(userName: string, token: string) {
    try {
      const hashed_token = await bcrypt.hash(token, this.saltOrRounds);
      await this.usersService.setCurrentRefreshToken(userName, hashed_token);
    } catch (error) {
      throw error;
    }
  }

  async verifyRefreshToken(username: string, token: string): Promise<Users> {
    try {
      const user = await this.usersService.findOne(username, 'username');
      if (!user) {
        throw new UnauthorizedException();
      }
      await this.verifyHashedContent(token, user.refreshToken);
      return user;
    } catch (err) {
      throw err;
    }
  }

  validateApiKey(apiKey: string) {
    return apiKey === process.env.API_KEY;
  }
}
