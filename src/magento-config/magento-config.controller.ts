import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MagentoConfigService } from './magento-config.service.js';
import { AuthGuard } from '@/guards/auth.guard.js';
import type { SystemConfigResponse } from '@/types/magento-config.types.js';
import { CoreConfig } from './magento-config.entity.js';

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

  @Post('field-value')
  getConfigValue(@Body() body: { path: string }): Promise<CoreConfig | null> {
    return this.magentoConfig.getConfigValue(body.path);
  }
}
