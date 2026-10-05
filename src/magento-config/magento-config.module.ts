import { Module } from '@nestjs/common';

import { MagentoConfigController } from '@/magento-config/magento-config.controller.js';
import { MagentoConfigService } from '@/magento-config/magento-config.service.js';
import { AuthGuard } from '@/guards/auth.guard.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreConfig } from './magento-config.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([CoreConfig])],
  controllers: [MagentoConfigController],
  providers: [MagentoConfigService, AuthGuard],
})
export class MagentoConfigModule {}
