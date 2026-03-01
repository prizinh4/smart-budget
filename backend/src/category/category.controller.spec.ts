import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryType } from './category.entity';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: CategoryService;

  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockCategory = {
    id: 'cat-123',
    name: 'Alimentação',
    type: CategoryType.EXPENSE,
    icon: 'food',
    color: '#FF5733',
  };

  const mockCategoryService = {
    create: jest.fn().mockResolvedValue(mockCategory),
    findAll: jest.fn().mockResolvedValue([mockCategory]),
    findOne: jest.fn().mockResolvedValue(mockCategory),
    update: jest.fn().mockResolvedValue({ ...mockCategory, name: 'Updated' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createDto = { name: 'Alimentação', type: CategoryType.EXPENSE };
      const req = { user: { userId: mockUser.id } };

      const result = await controller.create(createDto, req);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.id);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const req = { user: { userId: mockUser.id } };

      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual([mockCategory]);
    });

    it('should filter by type', async () => {
      const req = { user: { userId: mockUser.id } };

      await controller.findAll(req, CategoryType.EXPENSE);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, CategoryType.EXPENSE);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const req = { user: { userId: mockUser.id } };

      const result = await controller.findOne('cat-123', req);

      expect(service.findOne).toHaveBeenCalledWith('cat-123', mockUser.id);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateDto = { name: 'Updated' };
      const req = { user: { userId: mockUser.id } };

      const result = await controller.update('cat-123', updateDto, req);

      expect(service.update).toHaveBeenCalledWith('cat-123', updateDto, mockUser.id);
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      const req = { user: { userId: mockUser.id } };

      await controller.remove('cat-123', req);

      expect(service.remove).toHaveBeenCalledWith('cat-123', mockUser.id);
    });
  });
});
