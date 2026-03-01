import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 1000, // 1 second
          limit: configService.get<number>('THROTTLE_SHORT_LIMIT') || 3,
        },
        {
          name: 'medium',
          ttl: 10000, // 10 seconds
          limit: configService.get<number>('THROTTLE_MEDIUM_LIMIT') || 20,
        },
        {
          name: 'long',
          ttl: 60000, // 1 minute
          limit: configService.get<number>('THROTTLE_LONG_LIMIT') || 100,
        },
      ],
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}