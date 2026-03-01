import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  private async invalidateDashboardCache(userId: string): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const cacheKey = `user:${userId}:dashboard:${currentMonth}`;
    await this.cacheManager.del(cacheKey);
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const [data, total] = await this.transactionRepo.findAndCount({
      where: { user: { id: userId } },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
      relations: ['user', 'category'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.user.id !== userId) {
      throw new ForbiddenException('Not allowed to access this transaction');
    }

    return transaction;
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const transaction = this.transactionRepo.create({
      title: dto.title,
      amount: dto.amount,
      type: dto.type,
      user: { id: userId },
      category: dto.categoryId ? { id: dto.categoryId } : undefined,
    });

    const saved = await this.transactionRepo.save(transaction);
    await this.invalidateDashboardCache(userId);
    return saved;
  }

  async update(id: string, userId: string, dto: Partial<CreateTransactionDto>) {
    const transaction = await this.findOne(id, userId);

    if (dto.title !== undefined) transaction.title = dto.title;
    if (dto.amount !== undefined) transaction.amount = dto.amount;
    if (dto.type !== undefined) transaction.type = dto.type;
    if (dto.categoryId !== undefined) {
      transaction.category = dto.categoryId ? { id: dto.categoryId } as any : null;
    }

    const saved = await this.transactionRepo.save(transaction);
    await this.invalidateDashboardCache(userId);
    return saved;
  }

  async remove(id: string, userId: string) {
    const transaction = await this.findOne(id, userId);
    await this.transactionRepo.remove(transaction);
    await this.invalidateDashboardCache(userId);
    return { deleted: true };
  }
}