import { SystemConfiguration } from './system-configuration.types.js';

export interface SystemConfigResponse {
  module: string;
  file: string;
  available: boolean;
  tabs: SystemConfiguration['tabs'];
  sections: SystemConfiguration['sections'];
  includes?: string[];
  additional?: SystemConfiguration['additional'];
}
