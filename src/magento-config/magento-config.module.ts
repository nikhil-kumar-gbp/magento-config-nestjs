import { Module } from '@nestjs/common';

import { MagentoConfigController } from '@/magento-config/magento-config.controller.js';
import { MagentoConfigService } from '@/magento-config/magento-config.service.js';
import { AuthGuard } from '@/guards/auth.guard.js';

@Module({
  controllers: [MagentoConfigController],
  providers: [MagentoConfigService, AuthGuard],
})
export class MagentoConfigModule {}
