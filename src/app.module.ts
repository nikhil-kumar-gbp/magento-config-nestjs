import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MagentoConfigModule } from '@/magento-config/magento-config.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MagentoConfigModule,
  ],
})
export class AppModule {}
