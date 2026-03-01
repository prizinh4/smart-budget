import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '../category.entity';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Alimentação', description: 'Category name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: CategoryType, example: 'expense', description: 'Category type' })
  @IsNotEmpty()
  @IsEnum(CategoryType)
  type: CategoryType;

  @ApiPropertyOptional({ example: 'food', description: 'Icon identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: '#FF5733', description: 'Color hex code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
