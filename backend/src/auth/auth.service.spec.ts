import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUserService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string | number> = {
        JWT_EXPIRATION: '15m',
        REFRESH_TOKEN_EXPIRATION_DAYS: 7,
      };
      return config[key];
    }),
  };

  const mockRefreshTokenRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const createUserDto = { email: 'test@example.com', password: 'password123' };

    it('should register a new user successfully', async () => {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const createdUser = { id: 'uuid-123', email: createUserDto.email, password: hashedPassword };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(createdUser);

      const result = await service.register(createUserDto);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(mockUserService.create).toHaveBeenCalled();
      expect(result).toEqual({ id: createdUser.id, email: createdUser.email });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserService.findByEmail.mockResolvedValue({ id: 'existing-user', email: createUserDto.email });

      await expect(service.register(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockUserService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should return access and refresh tokens on successful login', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const user = { id: 'uuid-123', email: loginDto.email, password: hashedPassword };

      mockUserService.findByEmail.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-token-123');
      mockRefreshTokenRepo.create.mockReturnValue({ token: 'refresh-token' });
      mockRefreshTokenRepo.save.mockResolvedValue({ token: 'refresh-token' });

      const result = await service.login(loginDto);

      expect(result.access_token).toBe('jwt-token-123');
      expect(result.refresh_token).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const user = { id: 'uuid-123', email: loginDto.email, password: 'wrong-hash' };
      mockUserService.findByEmail.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      const user = { id: 'uuid-123', email: 'test@example.com' };
      const tokenEntity = {
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 86400000), // tomorrow
        revoked: false,
        user,
      };

      mockRefreshTokenRepo.findOne.mockResolvedValue(tokenEntity);
      mockRefreshTokenRepo.save.mockResolvedValue({ ...tokenEntity, revoked: true });
      mockRefreshTokenRepo.create.mockReturnValue({ token: 'new-refresh-token' });
      mockJwtService.sign.mockReturnValue('new-jwt-token');

      const result = await service.refresh('valid-refresh-token');

      expect(result.access_token).toBe('new-jwt-token');
      expect(result.refresh_token).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockRefreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const tokenEntity = {
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 86400000), // yesterday
        revoked: false,
        user: { id: 'uuid-123' },
      };

      mockRefreshTokenRepo.findOne.mockResolvedValue(tokenEntity);

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      const tokenEntity = { token: 'refresh-token', revoked: false };
      mockRefreshTokenRepo.findOne.mockResolvedValue(tokenEntity);
      mockRefreshTokenRepo.save.mockResolvedValue({ ...tokenEntity, revoked: true });

      const result = await service.logout('refresh-token');

      expect(result.message).toBe('Logged out successfully');
      expect(mockRefreshTokenRepo.save).toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('should revoke all user refresh tokens', async () => {
      mockRefreshTokenRepo.update.mockResolvedValue({ affected: 3 });

      const result = await service.logoutAll('user-123');

      expect(result.message).toBe('All sessions logged out');
      expect(mockRefreshTokenRepo.update).toHaveBeenCalled();
    });
  });
});
