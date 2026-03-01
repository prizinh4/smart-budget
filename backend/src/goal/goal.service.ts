import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, GoalStatus } from './goal.entity';
import { CreateGoalDto, UpdateGoalDto, AddContributionDto } from './dto';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
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
