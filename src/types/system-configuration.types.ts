import type { TextOrAttributed, XmlNodeValue } from './xml-element.types.js';

export type { TextOrAttributed };

/**
 * API contract for normalized Magento system configuration.
 * Known metadata is promoted. Anything else is kept under `additional`.
 */
export interface AdditionalContent {
  attributes?: Record<string, string>;
  elements?: Record<string, XmlNodeValue | XmlNodeValue[]>;
}

export interface SystemOption {
  value: string;
  label?: string;
  additionalAttributes?: Record<string, string>;
}

export interface SystemDependency {
  id: string;
  value?: string;
  negative?: string;
  separator?: string;
  additionalAttributes?: Record<string, string>;
}

export interface SystemRequires {
  fields: Array<{ id: string; value?: string }>;
  groups: Array<{ id: string }>;
}

export interface SourceService {
  value: string;
  idField?: string;
  labelField?: string;
  includeEmptyValueOption?: string;
  additionalAttributes?: Record<string, string>;
}

export interface SystemAttributeNode {
  type: string;
  value?: string;
  additionalAttributes?: Record<string, string>;
  children?: Record<string, XmlNodeValue | XmlNodeValue[]>;
}

export interface SystemTab {
  id: string;
  translate?: string;
  sortOrder?: string;
  cssClass?: string;
  label?: TextOrAttributed;
  additionalAttributes?: Record<string, string>;
  additional?: AdditionalContent;
}

export interface SystemField {
  id: string;
  translate?: string;
  type?: string;
  sortOrder?: string;
  showInDefault?: string;
  showInWebsite?: string;
  showInStore?: string;
  canRestore?: string;
  advanced?: string;
  extends?: string;
  additionalAttributes?: Record<string, string>;
  label?: TextOrAttributed;
  comment?: TextOrAttributed;
  tooltip?: TextOrAttributed;
  hint?: TextOrAttributed;
  default?: TextOrAttributed;
  frontendClass?: TextOrAttributed;
  frontendModel?: TextOrAttributed;
  backendModel?: TextOrAttributed;
  sourceModel?: TextOrAttributed;
  configPath?: TextOrAttributed;
  validate?: TextOrAttributed;
  canBeEmpty?: TextOrAttributed;
  ifModuleEnabled?: TextOrAttributed;
  buttonLabel?: TextOrAttributed;
  hideInSingleStoreMode?: TextOrAttributed;
  uploadDir?: TextOrAttributed;
  baseUrl?: TextOrAttributed;
  buttonUrl?: TextOrAttributed;
  moreUrl?: TextOrAttributed;
  demoUrl?: TextOrAttributed;
  sourceService?: SourceService;
  options?: SystemOption[];
  depends?: SystemDependency[];
  requires?: SystemRequires;
  attributeNodes?: SystemAttributeNode[];
  additional?: AdditionalContent;
}

export interface SystemGroup {
  id: string;
  translate?: string;
  type?: string;
  sortOrder?: string;
  showInDefault?: string;
  showInWebsite?: string;
  showInStore?: string;
  canRestore?: string;
  advanced?: string;
  extends?: string;
  additionalAttributes?: Record<string, string>;
  label?: TextOrAttributed;
  fieldsetCss?: TextOrAttributed;
  frontendModel?: TextOrAttributed;
  cloneModel?: TextOrAttributed;
  cloneFields?: TextOrAttributed;
  helpUrl?: TextOrAttributed;
  moreUrl?: TextOrAttributed;
  demoLink?: TextOrAttributed;
  comment?: TextOrAttributed;
  hideInSingleStoreMode?: TextOrAttributed;
  fields: SystemField[];
  groups: SystemGroup[];
  depends?: SystemDependency[];
  attributeNodes?: SystemAttributeNode[];
  includes?: string[];
  additional?: AdditionalContent;
}

export interface SystemSection {
  id: string;
  translate?: string;
  type?: string;
  sortOrder?: string;
  showInDefault?: string;
  showInWebsite?: string;
  showInStore?: string;
  canRestore?: string;
  advanced?: string;
  extends?: string;
  additionalAttributes?: Record<string, string>;
  label?: TextOrAttributed;
  cssClass?: TextOrAttributed;
  tab?: TextOrAttributed;
  headerCss?: TextOrAttributed;
  resource?: TextOrAttributed;
  frontendModel?: TextOrAttributed;
  groups: SystemGroup[];
  includes?: string[];
  additional?: AdditionalContent;
}

export interface SystemConfiguration {
  tabs: SystemTab[];
  sections: SystemSection[];
  includes: string[];
  additional?: AdditionalContent;
}
