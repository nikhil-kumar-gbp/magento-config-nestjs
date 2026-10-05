import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import fs from 'fs';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { SystemXmlNormalizer } from '@/xml/system-xml.normalizer.js';
import { XmlDocumentParser } from '@/xml/xml-document.parser.js';
import { ConfigService } from '@nestjs/config';
import {
  MODULE_NAME_REGEX,
  SYSTEM_XML_PATH,
  VENDOR_DIR,
} from '@/constants/config.js';

import type { SystemConfigResponse } from '@/types/magento-config.types.js';
import { Repository } from 'typeorm';
import { CoreConfig } from './magento-config.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { isErrno, readMagentoRoot, emptyConfig } from '@/helper/index.js';

@Injectable()
export class MagentoConfigService {
  private readonly magentoRoot: string;
  private readonly parser: XmlDocumentParser;
  private readonly normalizer: SystemXmlNormalizer;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(CoreConfig)
    private readonly coreConfigRepository: Repository<CoreConfig>,
  ) {
    this.magentoRoot = readMagentoRoot(this.configService);
    this.parser = new XmlDocumentParser();
    this.normalizer = new SystemXmlNormalizer();
  }

  async getConfig(moduleName: string): Promise<SystemConfigResponse> {
    const moduleDir = this.moduleDirectory(moduleName);

    await this.assertModuleExists(moduleName, moduleDir);

    const xmlPath = path.join(moduleDir, SYSTEM_XML_PATH);

    let xml: string;

    try {
      xml = await readFile(xmlPath, 'utf8');
    } catch (error) {
      if (isErrno(error, 'ENOENT')) {
        return emptyConfig(moduleName);
      }
      if (isErrno(error, 'EACCES') || isErrno(error, 'EPERM')) {
        throw new InternalServerErrorException(
          `Cannot read ${SYSTEM_XML_PATH} for module "${moduleName}".`,
        );
      }
      throw error;
    }

    try {
      const parsed = this.parser.parse(xml);

      const configuration = this.normalizer.normalize(parsed);

      return {
        module: moduleName,
        file: SYSTEM_XML_PATH,
        available: true,
        tabs: configuration.tabs,
        sections: configuration.sections,
        ...(configuration.includes.length > 0
          ? { includes: configuration.includes }
          : {}),
        ...(configuration.additional
          ? { additional: configuration.additional }
          : {}),
      };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown parse failure';
      throw new UnprocessableEntityException(
        `Failed to parse ${SYSTEM_XML_PATH} for module "${moduleName}": ${reason}`,
      );
    }
  }

  async getModules(): Promise<string[]> {
    const vendorDir = path.join(this.magentoRoot, VENDOR_DIR);

    const vendors = await readdir(vendorDir);

    const modulesList = [];

    for (let vendor of vendors) {
      const modulesDir = path.join(vendorDir, vendor);

      const modules = await readdir(modulesDir);

      for (let module of modules) {
        const moduleName = `${vendor}_${module}`;

        if (MODULE_NAME_REGEX.test(moduleName)) {
          modulesList.push(moduleName);
        }
      }
    }

    return modulesList;
  }

  async getConfigValue(path: string): Promise<CoreConfig | null> {
    try {
      const config = await this.coreConfigRepository.findOne({
        where: {
          path,
        },
      });

      if (!config) {
        throw new NotFoundException(
          `Config value for path "${path}" was not found.`,
        );
      }

      return config;
    } catch (error) {
      console.log(error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      if (isErrno(error, 'ENOENT')) {
        throw new NotFoundException(
          `Config value for path "${path}" was not found.`,
        );
      }

      return null;
    }
  }

  private moduleDirectory(moduleName: string): string {
    const match = MODULE_NAME_REGEX.exec(moduleName);

    if (!match) {
      throw new BadRequestException(
        `Module name "${moduleName}" is invalid. Expected Vendor_Module.`,
      );
    }

    return path.join(this.magentoRoot, VENDOR_DIR, ...match.slice(1));
  }

  private async assertModuleExists(
    moduleName: string,
    moduleDir: string,
  ): Promise<void> {
    try {
      const stat = await fs.promises.stat(moduleDir);

      if (!stat.isDirectory()) {
        throw new NotFoundException(
          `Magento module "${moduleName}" was not found.`,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (isErrno(error, 'ENOENT')) {
        throw new NotFoundException(
          `Magento module "${moduleName}" was not found.`,
        );
      }
      if (isErrno(error, 'EACCES') || isErrno(error, 'EPERM')) {
        throw new InternalServerErrorException(
          `Cannot read module "${moduleName}".`,
        );
      }
      throw error;
    }
  }
}
