import { Test, TestingModule } from '@nestjs/testing';
import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';
import { GoalStatus } from './goal.entity';

describe('GoalController', () => {
  let controller: GoalController;
  let service: GoalService;

  const mockUser = { userId: 'user-123', email: 'test@example.com' };
  const mockGoal = {
    id: 'goal-123',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 2500,
    status: GoalStatus.ACTIVE,
  };

  const mockGoalService = {
    create: jest.fn().mockResolvedValue(mockGoal),
    findAll: jest.fn().mockResolvedValue([mockGoal]),
    findOne: jest.fn().mockResolvedValue(mockGoal),
    update: jest.fn().mockResolvedValue({ ...mockGoal, name: 'Updated' }),
    addContribution: jest.fn().mockResolvedValue({ ...mockGoal, currentAmount: 3000 }),
    remove: jest.fn().mockResolvedValue(undefined),
    getProgress: jest.fn().mockResolvedValue({ percentage: 25, remaining: 7500 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalController],
      providers: [
        {
          provide: GoalService,
          useValue: mockGoalService,
        },
      ],
    }).compile();

    controller = module.get<GoalController>(GoalController);
    service = module.get<GoalService>(GoalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a goal', async () => {
      const createDto = { name: 'New Goal', targetAmount: 5000 };
      const req = { user: mockUser };

      const result = await controller.create(createDto, req);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.userId);
      expect(result).toEqual(mockGoal);
    });
  });

  describe('findAll', () => {
    it('should return all goals', async () => {
      const req = { user: mockUser };

      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.userId, undefined);
      expect(result).toEqual([mockGoal]);
    });

    it('should filter by status', async () => {
      const req = { user: mockUser };

      await controller.findAll(req, GoalStatus.ACTIVE);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.userId, GoalStatus.ACTIVE);
    });
  });

  describe('findOne', () => {
    it('should return a goal by id', async () => {
      const req = { user: mockUser };

      const result = await controller.findOne('goal-123', req);

      expect(service.findOne).toHaveBeenCalledWith('goal-123', mockUser.userId);
      expect(result).toEqual(mockGoal);
    });
  });

  describe('getProgress', () => {
    it('should return goal progress', async () => {
      const req = { user: mockUser };

      const result = await controller.getProgress('goal-123', req);

      expect(service.getProgress).toHaveBeenCalledWith('goal-123', mockUser.userId);
      expect(result).toEqual({ percentage: 25, remaining: 7500 });
    });
  });

  describe('update', () => {
    it('should update a goal', async () => {
      const updateDto = { name: 'Updated' };
      const req = { user: mockUser };

      const result = await controller.update('goal-123', updateDto, req);

      expect(service.update).toHaveBeenCalledWith('goal-123', updateDto, mockUser.userId);
      expect(result.name).toBe('Updated');
    });
  });

  describe('addContribution', () => {
    it('should add contribution to a goal', async () => {
      const contributionDto = { amount: 500 };
      const req = { user: mockUser };

      const result = await controller.addContribution('goal-123', contributionDto, req);

      expect(service.addContribution).toHaveBeenCalledWith('goal-123', contributionDto, mockUser.userId);
      expect(result.currentAmount).toBe(3000);
    });
  });

  describe('remove', () => {
    it('should remove a goal', async () => {
      const req = { user: mockUser };

      await controller.remove('goal-123', req);

      expect(service.remove).toHaveBeenCalledWith('goal-123', mockUser.userId);
    });
  });
});
