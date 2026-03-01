import { Injectable, Inject } from '@nestjs/common';
import { Transaction } from '../transaction/transaction.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  private getCacheKey(userId: string, month?: string): string {
    const currentMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
    return `user:${userId}:dashboard:${currentMonth}`;
  }

  async getDashboard(userId: string, month?: string) {
    const cacheKey = this.getCacheKey(userId, month);

    // Try to get from cache first
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Calculate from database
    const dashboardData = await this.calculateDashboard(userId, month);

    // Save to cache (TTL is configured globally in cache module - 5 min)
    await this.cacheManager.set(cacheKey, dashboardData);

    return dashboardData;
  }

  async calculateDashboard(userId: string, month?: string) {
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    const [year, monthNum] = currentMonth.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

    // Total Income
    const totalIncome = await this.transactionRepo
      .createQueryBuilder('t')
      .leftJoin('t.user', 'user')
      .select('SUM(t.amount)', 'sum')
      .where('user.id = :userId AND t.type = :type', { userId, type: 'income' })
      .andWhere('t.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    // Total Expenses
    const totalExpenses = await this.transactionRepo
      .createQueryBuilder('t')
      .leftJoin('t.user', 'user')
      .select('SUM(t.amount)', 'sum')
      .where('user.id = :userId AND t.type = :type', { userId, type: 'expense' })
      .andWhere('t.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    // Ranking by categories
    const categoriesRanking = await this.transactionRepo
      .createQueryBuilder('t')
      .leftJoin('t.user', 'user')
      .leftJoin('t.category', 'category')
      .select('category.name', 'name')
      .addSelect('SUM(t.amount)', 'total')
      .where('user.id = :userId', { userId })
      .andWhere('t.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('total', 'DESC')
      .getRawMany();

    return {
      month: currentMonth,
      totalIncome: Number(totalIncome.sum) || 0,
      totalExpenses: Number(totalExpenses.sum) || 0,
      balance: (Number(totalIncome.sum) || 0) - (Number(totalExpenses.sum) || 0),
      categoriesRanking,
    };
  }

  async invalidateCache(userId: string, month?: string): Promise<void> {
    const cacheKey = this.getCacheKey(userId, month);
    await this.cacheManager.del(cacheKey);
  }
}