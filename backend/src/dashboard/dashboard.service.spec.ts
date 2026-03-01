import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from '../transaction/transaction.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockCacheManager: any;
  let mockQueryBuilder: any;

  const mockRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
    };

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Transaction), useValue: mockRepository },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    const userId = 'user-123';
    const month = '2026-03';

    it('should return cached data if available', async () => {
      const cachedData = {
        month: '2026-03',
        totalIncome: 5000,
        totalExpenses: 2000,
        balance: 3000,
        categoriesRanking: [],
      };

      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getDashboard(userId, month);

      expect(mockCacheManager.get).toHaveBeenCalledWith(`user:${userId}:dashboard:${month}`);
      expect(result).toEqual(cachedData);
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should calculate and cache data if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ sum: '5000' }) // income
        .mockResolvedValueOnce({ sum: '2000' }); // expenses
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { name: 'Food', total: '1000' },
        { name: 'Transport', total: '500' },
      ]);

      const result = await service.getDashboard(userId, month);

      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(result).toEqual({
        month: '2026-03',
        totalIncome: 5000,
        totalExpenses: 2000,
        balance: 3000,
        categoriesRanking: [
          { name: 'Food', total: '1000' },
          { name: 'Transport', total: '500' },
        ],
      });
    });
  });

  describe('invalidateCache', () => {
    it('should delete cache for user and month', async () => {
      const userId = 'user-123';
      const month = '2026-03';

      await service.invalidateCache(userId, month);

      expect(mockCacheManager.del).toHaveBeenCalledWith(`user:${userId}:dashboard:${month}`);
    });
  });
});
