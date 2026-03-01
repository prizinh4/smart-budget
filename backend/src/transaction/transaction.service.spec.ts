import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction, TransactionType } from './transaction.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TransactionService', () => {
  let service: TransactionService;
  let repository: jest.Mocked<Repository<Transaction>>;

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: getRepositoryToken(Transaction), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    repository = module.get(getRepositoryToken(Transaction));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const userId = 'user-uuid-123';
      const transactions = [
        { id: 'tx-1', title: 'Salary', amount: 5000, type: TransactionType.INCOME },
        { id: 'tx-2', title: 'Rent', amount: 1500, type: TransactionType.EXPENSE },
      ];

      mockRepository.findAndCount.mockResolvedValue([transactions, 24]);

      const result = await service.findAll(userId, 2, 10);

      expect(result).toEqual({
        data: transactions,
        total: 24,
        page: 2,
        lastPage: 3,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['category'],
        skip: 10,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should use default pagination values', async () => {
      const userId = 'user-uuid-123';
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(userId);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['category'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('should create a transaction with category', async () => {
      const userId = 'user-uuid-123';
      const dto = { title: 'Groceries', amount: 150, type: TransactionType.EXPENSE, categoryId: 'cat-123' };
      const savedTransaction = { id: 'tx-123', ...dto, user: { id: userId }, category: { id: dto.categoryId } };

      mockRepository.create.mockReturnValue(savedTransaction);
      mockRepository.save.mockResolvedValue(savedTransaction);

      const result = await service.create(userId, dto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        title: dto.title,
        amount: dto.amount,
        type: dto.type,
        user: { id: userId },
        category: { id: dto.categoryId },
      });
      expect(result).toEqual(savedTransaction);
    });

    it('should create a transaction without category', async () => {
      const userId = 'user-uuid-123';
      const dto = { title: 'Bonus', amount: 500, type: TransactionType.INCOME };

      mockRepository.create.mockReturnValue({ id: 'tx-123', ...dto, user: { id: userId } });
      mockRepository.save.mockResolvedValue({ id: 'tx-123', ...dto, user: { id: userId } });

      await service.create(userId, dto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        title: dto.title,
        amount: dto.amount,
        type: dto.type,
        user: { id: userId },
        category: undefined,
      });
    });
  });

  describe('findOne', () => {
    it('should return a transaction if found and owned by user', async () => {
      const userId = 'user-uuid-123';
      const transaction = { id: 'tx-1', title: 'Salary', user: { id: userId } };
      mockRepository.findOne.mockResolvedValue(transaction);

      const result = await service.findOne('tx-1', userId);

      expect(result).toEqual(transaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('tx-1', 'user-123')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if transaction belongs to another user', async () => {
      const transaction = { id: 'tx-1', title: 'Salary', user: { id: 'other-user' } };
      mockRepository.findOne.mockResolvedValue(transaction);

      await expect(service.findOne('tx-1', 'user-123')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update and return transaction', async () => {
      const userId = 'user-uuid-123';
      const transaction = { id: 'tx-1', title: 'Old', amount: 100, type: TransactionType.EXPENSE, user: { id: userId } };
      const updatedData = { title: 'New', amount: 200 };

      mockRepository.findOne.mockResolvedValue({ ...transaction });
      mockRepository.save.mockResolvedValue({ ...transaction, ...updatedData });

      const result = await service.update('tx-1', userId, updatedData);

      expect(result.title).toBe('New');
      expect(result.amount).toBe(200);
    });
  });

  describe('remove', () => {
    it('should delete transaction and return confirmation', async () => {
      const userId = 'user-uuid-123';
      const transaction = { id: 'tx-1', title: 'Salary', user: { id: userId } };
      mockRepository.findOne.mockResolvedValue(transaction);
      mockRepository.remove.mockResolvedValue(transaction);

      const result = await service.remove('tx-1', userId);

      expect(result).toEqual({ deleted: true });
      expect(mockRepository.remove).toHaveBeenCalledWith(transaction);
    });
  });
});