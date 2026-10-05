import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MagentoConfigModule } from '@/magento-config/magento-config.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySqlConfig } from './config/mysql.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      useClass: MySqlConfig,
      inject: [ConfigService],
    }),

    MagentoConfigModule,
  ],
})
export class AppModule {}
