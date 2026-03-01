import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
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

    it('should return access token on successful login', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const user = { id: 'uuid-123', email: loginDto.email, password: hashedPassword };

      mockUserService.findByEmail.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'jwt-token-123',
        id: user.id,
        email: user.email,
      });
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
});
