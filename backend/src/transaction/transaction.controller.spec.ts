import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionType } from './transaction.entity';

describe('TransactionController', () => {
  let controller: TransactionController;
  let transactionService: jest.Mocked<TransactionService>;

  const mockTransactionService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [{ provide: TransactionService, useValue: mockTransactionService }],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    transactionService = module.get(TransactionService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const req = { user: { userId: 'user-123' } };
      const paginatedResult = {
        data: [{ id: 'tx-1', title: 'Salary', amount: 5000, type: TransactionType.INCOME }],
        total: 1,
        page: 1,
        lastPage: 1,
      };

      mockTransactionService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.getTransactions(req, 1, 10);

      expect(mockTransactionService.findAll).toHaveBeenCalledWith('user-123', 1, 10);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('createTransaction', () => {
    it('should create a new transaction', async () => {
      const req = { user: { userId: 'user-123' } };
      const dto = { title: 'Groceries', amount: 150, type: TransactionType.EXPENSE };
      const createdTransaction = { id: 'tx-123', ...dto, user: { id: 'user-123' } };

      mockTransactionService.create.mockResolvedValue(createdTransaction);

      const result = await controller.createTransaction(req, dto);

      expect(mockTransactionService.create).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(createdTransaction);
    });
  });
});
