import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MagentoConfigService } from './magento-config.service.js';
import { AuthGuard } from '@/guards/auth.guard.js';
import type { SystemConfigResponse } from '@/types/magento-config.types.js';

@Controller('modules')
@UseGuards(AuthGuard)
export class MagentoConfigController {
  constructor(private readonly magentoConfig: MagentoConfigService) {}

  @Get('config/:module')
  getConfig(
    @Param('module') moduleName: string,
  ): Promise<SystemConfigResponse> {
    return this.magentoConfig.getConfig(moduleName);
  }

  @Get('list')
  getModules(): Promise<string[]> {
    return this.magentoConfig.getModules();
  }
}
