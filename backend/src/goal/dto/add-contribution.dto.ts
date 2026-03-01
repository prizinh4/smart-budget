import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddContributionDto {
  @ApiProperty({ example: 100, description: 'Amount to add to the goal' })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
