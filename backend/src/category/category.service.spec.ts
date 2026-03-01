import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryService } from './category.service';
import { Category, CategoryType } from './category.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: Repository<Category>;

  const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };

  const mockCategory: Partial<Category> = {
    id: 'cat-123',
    name: 'Alimentação',
    type: CategoryType.EXPENSE,
    icon: 'food',
    color: '#FF5733',
    user: mockUser as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockCategory]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createDto = { name: 'Alimentação', type: CategoryType.EXPENSE };
      mockRepository.create.mockReturnValue(mockCategory);
      mockRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create(createDto, mockUser.id);

      expect(mockRepository.create).toHaveBeenCalledWith({ ...createDto, user: { id: mockUser.id } });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findAll', () => {
    it('should return all categories for a user', async () => {
      const result = await service.findAll(mockUser.id);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('category');
      expect(result).toEqual([mockCategory]);
    });

    it('should filter by type when provided', async () => {
      await service.findAll(mockUser.id, CategoryType.EXPENSE);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a category by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne('cat-123', mockUser.id);

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockUser.id)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if category belongs to another user', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockCategory, user: { id: 'other-user' } });

      await expect(service.findOne('cat-123', mockUser.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockCategory });
      mockRepository.save.mockResolvedValue({ ...mockCategory, name: 'Updated' });

      const result = await service.update('cat-123', { name: 'Updated' }, mockUser.id);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.remove.mockResolvedValue(mockCategory);

      await service.remove('cat-123', mockUser.id);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockCategory);
    });
  });
});
