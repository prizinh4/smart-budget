import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TransactionModule } from './transaction/transaction.module';
import { CategoryModule } from './category/category.module';
import { GoalModule } from './goal/goal.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CacheConfigModule } from './cache/cache.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, 
    }),
    CacheConfigModule,
    HealthModule,
    UserModule,
    AuthModule,
    TransactionModule,
    CategoryModule,
    GoalModule,
    DashboardModule,
  ],
})
export class AppModule {}