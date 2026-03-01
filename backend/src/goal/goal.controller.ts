import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GoalService } from './goal.service';
import { CreateGoalDto, UpdateGoalDto, AddContributionDto } from './dto';
import { GoalStatus } from './goal.entity';

@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('goals')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiResponse({ status: 201, description: 'Goal created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createGoalDto: CreateGoalDto, @Request() req) {
    return this.goalService.create(createGoalDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all goals for the authenticated user' })
  @ApiQuery({ name: 'status', enum: GoalStatus, required: false, description: 'Filter by goal status' })
  @ApiResponse({ status: 200, description: 'List of goals' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Request() req, @Query('status') status?: GoalStatus) {
    return this.goalService.findAll(req.user.userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a goal by ID' })
  @ApiResponse({ status: 200, description: 'Goal found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your goal' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.goalService.findOne(id, req.user.userId);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get goal progress (percentage and remaining amount)' })
  @ApiResponse({ status: 200, description: 'Goal progress' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async getProgress(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.goalService.getProgress(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a goal' })
  @ApiResponse({ status: 200, description: 'Goal updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your goal' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @Request() req,
  ) {
    return this.goalService.update(id, updateGoalDto, req.user.userId);
  }

  @Post(':id/contribute')
  @ApiOperation({ summary: 'Add a contribution to a goal' })
  @ApiResponse({ status: 200, description: 'Contribution added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - goal not active' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async addContribution(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() contributionDto: AddContributionDto,
    @Request() req,
  ) {
    return this.goalService.addContribution(id, contributionDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a goal' })
  @ApiResponse({ status: 204, description: 'Goal deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your goal' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.goalService.remove(id, req.user.userId);
  }
}
