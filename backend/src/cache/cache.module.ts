import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');
        
        // If Redis is not configured, use in-memory cache
        if (!redisHost) {
          return {
            ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
          };
        }

        return {
          store: await redisStore({
            socket: {
              host: redisHost,
              port: configService.get<number>('REDIS_PORT') || 6379,
            },
            password: configService.get<string>('REDIS_PASSWORD'),
            ttl: 5 * 60 * 1000, // 5 minutes
          }),
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheConfigModule {}
