import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal } from './goal.entity';
import { GoalService } from './goal.service';
import { GoalController } from './goal.controller';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [TypeOrmModule.forFeature([Goal]), TransactionModule],
  controllers: [GoalController],
  providers: [GoalService],
})
export class GoalModule {}