import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsDateString, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalStatus } from '../goal.entity';

export class CreateGoalDto {
  @ApiProperty({ example: 'Emergency Fund', description: 'Goal name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Save 6 months of expenses', description: 'Goal description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 10000, description: 'Target amount to save' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  targetAmount: number;

  @ApiPropertyOptional({ example: 500, description: 'Current saved amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Goal deadline (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ example: 'savings', description: 'Icon identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: '#4CAF50', description: 'Color hex code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
