import { IsNumber, Min, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddContributionDto {
  @ApiProperty({ example: 100, description: 'Amount to add to the goal' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Monthly contribution to vacation fund', description: 'Optional description for the transaction' })
  @IsString()
  @IsOptional()
  description?: string;
}
