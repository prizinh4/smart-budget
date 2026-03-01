import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('goals')
@Controller('goals')
export class GoalController {}
