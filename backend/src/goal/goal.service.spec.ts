import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalService } from './goal.service';
import { Goal, GoalStatus } from './goal.entity';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { TransactionService } from '../transaction/transaction.service';

describe('GoalService', () => {
  let service: GoalService;
  let repository: Repository<Goal>;

  const mockUser = { id: 'user-123', email: 'test@example.com' };

  const mockGoal: Partial<Goal> = {
    id: 'goal-123',
    name: 'Emergency Fund',
    description: 'Save 6 months expenses',
    targetAmount: 10000,
    currentAmount: 2500,
    status: GoalStatus.ACTIVE,
    deadline: new Date('2026-12-31'),
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
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockGoal]),
    })),
  };

  const mockTransactionService = {
    create: jest.fn().mockResolvedValue({ id: 'tx-123' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalService,
        {
          provide: getRepositoryToken(Goal),
          useValue: mockRepository,
        },
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    service = module.get<GoalService>(GoalService);
    repository = module.get<Repository<Goal>>(getRepositoryToken(Goal));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a goal', async () => {
      const createDto = { name: 'New Goal', targetAmount: 5000 };
      mockRepository.create.mockReturnValue(mockGoal);
      mockRepository.save.mockResolvedValue(mockGoal);

      const result = await service.create(createDto, mockUser.id);

      expect(mockRepository.create).toHaveBeenCalledWith({ ...createDto, user: { id: mockUser.id } });
      expect(result).toEqual(mockGoal);
    });
  });

  describe('findAll', () => {
    it('should return all goals for a user', async () => {
      const result = await service.findAll(mockUser.id);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('goal');
      expect(result).toEqual([mockGoal]);
    });

    it('should filter by status when provided', async () => {
      await service.findAll(mockUser.id, GoalStatus.ACTIVE);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a goal by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockGoal);

      const result = await service.findOne('goal-123', mockUser.id);

      expect(result).toEqual(mockGoal);
    });

    it('should throw NotFoundException if goal not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockUser.id)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if goal belongs to another user', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockGoal, user: { id: 'other-user' } });

      await expect(service.findOne('goal-123', mockUser.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a goal', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockGoal });
      mockRepository.save.mockResolvedValue({ ...mockGoal, name: 'Updated' });

      const result = await service.update('goal-123', { name: 'Updated' }, mockUser.id);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated');
    });

    it('should auto-complete goal when currentAmount >= targetAmount', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockGoal, targetAmount: 5000 });
      mockRepository.save.mockImplementation((goal) => Promise.resolve(goal));

      const result = await service.update('goal-123', { currentAmount: 5000 }, mockUser.id);

      expect(result.status).toBe(GoalStatus.COMPLETED);
    });
  });

  describe('addContribution', () => {
    it('should add contribution to an active goal and create expense transaction', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockGoal, currentAmount: 1000, name: 'Test Goal' });
      mockRepository.save.mockImplementation((goal) => Promise.resolve(goal));

      const result = await service.addContribution('goal-123', { amount: 500 }, mockUser.id);

      expect(result.currentAmount).toBe(1500);
      expect(mockTransactionService.create).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          amount: 500,
          type: 'expense',
        })
      );
    });

    it('should use custom description when provided', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockGoal, currentAmount: 1000, name: 'Test Goal' });
      mockRepository.save.mockImplementation((goal) => Promise.resolve(goal));

      await service.addContribution('goal-123', { amount: 200, description: 'Monthly savings' }, mockUser.id);

      expect(mockTransactionService.create).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          title: 'Monthly savings',
          amount: 200,
          type: 'expense',
        })
      );
    });

    it('should throw BadRequestException for non-active goals', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockGoal, status: GoalStatus.COMPLETED });

      await expect(
        service.addContribution('goal-123', { amount: 500 }, mockUser.id)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a goal', async () => {
      mockRepository.findOne.mockResolvedValue(mockGoal);
      mockRepository.remove.mockResolvedValue(mockGoal);

      await service.remove('goal-123', mockUser.id);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockGoal);
    });
  });

  describe('getProgress', () => {
    it('should return goal progress', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockGoal, currentAmount: 2500, targetAmount: 10000 });

      const result = await service.getProgress('goal-123', mockUser.id);

      expect(result.percentage).toBe(25);
      expect(result.remaining).toBe(7500);
    });
  });
});
