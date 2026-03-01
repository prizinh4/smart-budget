import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userService.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return { id: user.id, email: user.email };
  }

  async login(loginDto: LoginUserDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      id: user.id,
      email: user.email,
    };
  }

  async refresh(refreshToken: string) {
    const tokenEntity = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken, revoked: false },
      relations: ['user'],
    });

    if (!tokenEntity) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token
    tokenEntity.revoked = true;
    await this.refreshTokenRepo.save(tokenEntity);

    // Generate new tokens
    const tokens = await this.generateTokens(tokenEntity.user.id, tokenEntity.user.email);

    return {
      ...tokens,
      id: tokenEntity.user.id,
      email: tokenEntity.user.email,
    };
  }

  async logout(refreshToken: string) {
    const tokenEntity = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken },
    });

    if (tokenEntity) {
      tokenEntity.revoked = true;
      await this.refreshTokenRepo.save(tokenEntity);
    }

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.refreshTokenRepo.update(
      { user: { id: userId }, revoked: false },
      { revoked: true },
    );

    return { message: 'All sessions logged out' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = randomBytes(64).toString('hex');
    const refreshExpirationDays = this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_DAYS') || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpirationDays);

    // Save refresh token to database
    const refreshTokenEntity = this.refreshTokenRepo.create({
      token: refreshToken,
      expiresAt,
      user: { id: userId },
    });
    await this.refreshTokenRepo.save(refreshTokenEntity);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.configService.get('JWT_EXPIRATION') || '15m',
    };
  }

  // Cleanup expired tokens (can be called by a cron job)
  async cleanupExpiredTokens() {
    await this.refreshTokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}