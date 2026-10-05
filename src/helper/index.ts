import fs from 'fs';

import { SYSTEM_XML_PATH } from '@/constants/config.js';
import { SystemConfigResponse } from '@/types/magento-config.types.js';
import { ConfigService } from '@nestjs/config';

export function emptyConfig(moduleName: string): SystemConfigResponse {
  return {
    module: moduleName,
    file: SYSTEM_XML_PATH,
    available: false,
    tabs: [],
    sections: [],
  };
}

export function readMagentoRoot(configService: ConfigService): string {
  const root = configService.get('MAGENTO_ROOT')?.trim();
  if (!root) {
    throw new Error('Set MAGENTO_ROOT to the Magento project directory.');
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(root);
  } catch {
    throw new Error(`MAGENTO_ROOT is not a directory: ${root}`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`MAGENTO_ROOT is not a directory: ${root}`);
  }

  return fs.realpathSync(root);
}

export function isErrno(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}
