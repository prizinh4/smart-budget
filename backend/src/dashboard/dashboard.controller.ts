import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({ summary: 'Get dashboard data with income, expenses and categories ranking' })
  @ApiQuery({ name: 'month', required: false, type: String, description: 'Month in YYYY-MM format (default: current month)' })
  @ApiResponse({ status: 200, description: 'Returns dashboard data (cached for 5 minutes)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(
    @Request() req,
    @Query('month') month?: string,
  ) {
    return this.dashboardService.getDashboard(req.user.userId, month);
  }
}