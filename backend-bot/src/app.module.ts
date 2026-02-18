import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-redis-yet';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppSchedulerModule } from './modules/scheduler/scheduler.module';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { GoogleSheetsModule } from './modules/google-sheets/google-sheets.module';
import { HealthModule } from './modules/health/health.module';
import { validate } from './config/env.validation';
import { PluginModule } from './core/plugins/plugin.module';
import { ChatModule } from './core/chat/chat.module';
import { SettingsModule } from './core/settings/settings.module';
import { WeatherModule } from './plugins/weather/weather.module';
import { CareerModule } from './plugins/career/career.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'bot_db'),
        autoLoadEntities: true,
        synchronize: true, // Use carefully in production!
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
          },
          ttl: 300000, // 5 minutes in milliseconds
        }),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    GoogleSheetsModule,
    CrawlerModule,
    AppSchedulerModule,
    PluginModule,
    ChatModule,
    SettingsModule,
    WeatherModule,
    CareerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
