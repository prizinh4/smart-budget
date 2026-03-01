import { PartialType } from '@nestjs/swagger';
import { CreateGoalDto } from './create-goal.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GoalStatus } from '../goal.entity';

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @ApiPropertyOptional({ enum: GoalStatus, example: 'completed', description: 'Goal status' })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;
}
