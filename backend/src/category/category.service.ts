import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryType } from './category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      user: { id: userId },
    });
    return this.categoryRepository.save(category);
  }

  async findAll(userId: string, type?: CategoryType): Promise<Category[]> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.user', 'user')
      .where('user.id = :userId', { userId });

    if (type) {
      queryBuilder.andWhere('category.type = :type', { type });
    }

    queryBuilder.orderBy('category.name', 'ASC');

    return queryBuilder.getMany();
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (category.user.id !== userId) {
      throw new ForbiddenException('You do not have access to this category');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string): Promise<Category> {
    const category = await this.findOne(id, userId);

    Object.assign(category, updateCategoryDto);

    return this.categoryRepository.save(category);
  }

  async remove(id: string, userId: string): Promise<void> {
    const category = await this.findOne(id, userId);
    await this.categoryRepository.remove(category);
  }
}

