import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TransactionType } from '../transaction.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ example: 'Grocery shopping', description: 'Transaction title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 150.50, description: 'Transaction amount' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: TransactionType, example: 'expense', description: 'Transaction type' })
  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ example: 'uuid-category-123', description: 'Category ID (optional)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
