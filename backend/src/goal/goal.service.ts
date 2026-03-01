import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, GoalStatus } from './goal.entity';
import { CreateGoalDto, UpdateGoalDto, AddContributionDto } from './dto';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionType } from '../transaction/transaction.entity';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
    private readonly transactionService: TransactionService,
  ) {}

  async create(createGoalDto: CreateGoalDto, userId: string): Promise<Goal> {
    const goal = this.goalRepository.create({
      ...createGoalDto,
      user: { id: userId },
    });
    return this.goalRepository.save(goal);
  }

  async findAll(userId: string, status?: GoalStatus): Promise<Goal[]> {
    const queryBuilder = this.goalRepository
      .createQueryBuilder('goal')
      .leftJoin('goal.user', 'user')
      .where('user.id = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('goal.status = :status', { status });
    }

    queryBuilder.orderBy('goal.deadline', 'ASC', 'NULLS LAST');

    return queryBuilder.getMany();
  }

  async findOne(id: string, userId: string): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    if (goal.user.id !== userId) {
      throw new ForbiddenException('You do not have access to this goal');
    }

    return goal;
  }

  async update(id: string, updateGoalDto: UpdateGoalDto, userId: string): Promise<Goal> {
    const goal = await this.findOne(id, userId);

    // Auto-complete goal if currentAmount >= targetAmount
    if (updateGoalDto.currentAmount !== undefined) {
      const targetAmount = updateGoalDto.targetAmount ?? goal.targetAmount;
      if (Number(updateGoalDto.currentAmount) >= Number(targetAmount)) {
        updateGoalDto.status = GoalStatus.COMPLETED;
      }
    }

    Object.assign(goal, updateGoalDto);

    return this.goalRepository.save(goal);
  }

  async addContribution(id: string, contributionDto: AddContributionDto, userId: string): Promise<Goal> {
    const goal = await this.findOne(id, userId);

    if (goal.status !== GoalStatus.ACTIVE) {
      throw new BadRequestException('Cannot add contribution to a non-active goal');
    }

    const newAmount = Number(goal.currentAmount) + contributionDto.amount;
    goal.currentAmount = newAmount;

    // Auto-complete goal if target reached
    if (newAmount >= Number(goal.targetAmount)) {
      goal.status = GoalStatus.COMPLETED;
    }

    // Create an expense transaction for this contribution (linked to goal)
    const transactionTitle = contributionDto.description || `Meta: ${goal.name}`;
    await this.transactionService.create(userId, {
      title: transactionTitle,
      amount: contributionDto.amount,
      type: TransactionType.EXPENSE,
      goalId: id,
    });

    return this.goalRepository.save(goal);
  }

  async getContributions(id: string, userId: string) {
    await this.findOne(id, userId); // Verify access
    return this.transactionService.findByGoalId(id, userId);
  }

  async syncExistingAmount(id: string, userId: string): Promise<Goal> {
    const goal = await this.findOne(id, userId);
    
    // Check if there are already linked transactions
    const existingContributions = await this.transactionService.findByGoalId(id, userId);
    const trackedAmount = existingContributions.reduce((sum, t) => sum + Number(t.amount), 0);
    const untrackedAmount = Number(goal.currentAmount) - trackedAmount;

    if (untrackedAmount <= 0) {
      return goal; // Nothing to sync
    }

    // Create a transaction for the untracked amount
    await this.transactionService.create(userId, {
      title: `Meta: ${goal.name} (sync)`,
      amount: untrackedAmount,
      type: TransactionType.EXPENSE,
      goalId: id,
    });

    return goal;
  }

  async removeContribution(goalId: string, transactionId: string, userId: string): Promise<Goal> {
    const goal = await this.findOne(goalId, userId);

    const result = await this.transactionService.removeByGoalId(goalId, transactionId, userId);
    
    // Reduce goal currentAmount
    const newAmount = Math.max(0, Number(goal.currentAmount) - result.amount);
    goal.currentAmount = newAmount;

    // If goal was completed and now is below target, reactivate it
    if (goal.status === GoalStatus.COMPLETED && newAmount < Number(goal.targetAmount)) {
      goal.status = GoalStatus.ACTIVE;
    }

    return this.goalRepository.save(goal);
  }

  async remove(id: string, userId: string): Promise<void> {
    const goal = await this.findOne(id, userId);
    await this.goalRepository.remove(goal);
  }

  async getProgress(id: string, userId: string): Promise<{ percentage: number; remaining: number }> {
    const goal = await this.findOne(id, userId);
    const current = Number(goal.currentAmount);
    const target = Number(goal.targetAmount);
    const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    const remaining = Math.max(0, target - current);

    return {
      percentage: Math.round(percentage * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
    };
  }
}
