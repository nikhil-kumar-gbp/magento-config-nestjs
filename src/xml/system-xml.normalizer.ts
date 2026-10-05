import type { XmlElement, XmlNodeValue } from '@/types/xml-element.types.js';
import type {
  AdditionalContent,
  SourceService,
  SystemAttributeNode,
  SystemConfiguration,
  SystemDependency,
  SystemField,
  SystemGroup,
  SystemOption,
  SystemRequires,
  SystemSection,
  SystemTab,
  TextOrAttributed,
} from '@/types/system-configuration.types.js';
import { SHARED_SYSTEM_XML_ATTRIBUTES } from '@/constants/attributes.js';

export class SystemXmlNormalizer {
  normalize(document: XmlElement): SystemConfiguration {
    if (document.name !== 'config') {
      throw new Error(
        `Expected root element "config" but found "${document.name}".`,
      );
    }

    const systems = document.children.filter(
      (child) => child.name === 'system',
    );
    if (systems.length !== 1 || !systems[0]) {
      throw new Error('Expected a single "system" element.');
    }

    const system = systems[0];

    const buckets = bucketChildren(system);

    const includes = takeAll(buckets, 'include').map((element, index) =>
      readInclude(element, `system include ${index + 1}`),
    );
    const tabs = takeAll(buckets, 'tab').map((element, index) =>
      normalizeTab(element, `tab ${index + 1}`),
    );
    const sections = takeAll(buckets, 'section').map((element, index) =>
      normalizeSection(element, `section ${index + 1}`),
    );

    return {
      tabs,
      sections,
      includes,
      ...additionalSpread(buildAdditional(undefined, leftovers(buckets))),
    };
  }
}

function normalizeTab(element: XmlElement, location: string): SystemTab {
  const id = requireId(element, location);
  const { promoted, additionalAttributes } = splitAttributes(element, [
    'translate',
    'sortOrder',
    'class',
  ]);
  const buckets = bucketChildren(element);
  const repeated = new Map<string, XmlNodeValue | XmlNodeValue[]>();
  const label = takeText(buckets, 'label', repeated);

  return {
    id,
    ...optional('translate', promoted.translate),
    ...optional('sortOrder', promoted.sortOrder),
    ...optional('cssClass', promoted.class),
    ...optional('additionalAttributes', additionalAttributes),
    ...optional('label', label),
    ...additionalSpread(
      buildAdditional(undefined, mergeElements(repeated, leftovers(buckets))),
    ),
  };
}

function normalizeSection(
  element: XmlElement,
  location: string,
): SystemSection {
  const id = requireId(element, location);
  const { promoted, additionalAttributes } = splitAttributes(
    element,
    SHARED_SYSTEM_XML_ATTRIBUTES,
  );
  const buckets = bucketChildren(element);

  const repeated = new Map<string, XmlNodeValue | XmlNodeValue[]>();
  const includes = takeAll(buckets, 'include').map((child, index) =>
    readInclude(child, `${id} include ${index + 1}`),
  );
  const groups = takeAll(buckets, 'group').map((child, index) =>
    normalizeGroup(child, `${id} group ${index + 1}`, id),
  );

  return {
    id,
    ...sharedAttributeSpread(promoted),
    ...optional('additionalAttributes', additionalAttributes),
    ...optional('label', takeText(buckets, 'label', repeated)),
    ...optional('cssClass', takeText(buckets, 'class', repeated)),
    ...optional('tab', takeText(buckets, 'tab', repeated)),
    ...optional('headerCss', takeText(buckets, 'header_css', repeated)),
    ...optional('resource', takeText(buckets, 'resource', repeated)),
    ...optional('frontendModel', takeText(buckets, 'frontend_model', repeated)),
    groups,
    ...(includes.length > 0 ? { includes } : {}),
    ...additionalSpread(
      buildAdditional(undefined, mergeElements(repeated, leftovers(buckets))),
    ),
  };
}

function normalizeGroup(
  element: XmlElement,
  location: string,
  sectionId: string,
): SystemGroup {
  const id = requireId(element, location);
  const { promoted, additionalAttributes } = splitAttributes(
    element,
    SHARED_SYSTEM_XML_ATTRIBUTES,
  );
  const buckets = bucketChildren(element);

  const repeated = new Map<string, XmlNodeValue | XmlNodeValue[]>();
  const fields = takeAll(buckets, 'field').map((child, index) =>
    normalizeField(child, `${location} field ${index + 1}`, sectionId, id),
  );
  const groups = takeAll(buckets, 'group').map((child, index) =>
    normalizeGroup(child, `${location}/${id} group ${index + 1}`, sectionId),
  );
  const depends = takeDepends(buckets, location);
  const attributeNodes = takeAttributeNodes(buckets, location);
  const includes = takeAll(buckets, 'include').map((child, index) =>
    readInclude(child, `${location} include ${index + 1}`),
  );

  return {
    id,
    ...sharedAttributeSpread(promoted),
    ...optional('additionalAttributes', additionalAttributes),
    ...optional('label', takeText(buckets, 'label', repeated)),
    ...optional('fieldsetCss', takeText(buckets, 'fieldset_css', repeated)),
    ...optional('frontendModel', takeText(buckets, 'frontend_model', repeated)),
    ...optional('cloneModel', takeText(buckets, 'clone_model', repeated)),
    ...optional('cloneFields', takeText(buckets, 'clone_fields', repeated)),
    ...optional('helpUrl', takeText(buckets, 'help_url', repeated)),
    ...optional('moreUrl', takeText(buckets, 'more_url', repeated)),
    ...optional('demoLink', takeText(buckets, 'demo_link', repeated)),
    ...optional('comment', takeText(buckets, 'comment', repeated)),
    ...optional(
      'hideInSingleStoreMode',
      takeText(buckets, 'hide_in_single_store_mode', repeated),
    ),
    fields,
    groups,
    ...(depends.length > 0 ? { depends } : {}),
    ...(attributeNodes.length > 0 ? { attributeNodes } : {}),
    ...(includes.length > 0 ? { includes } : {}),
    ...additionalSpread(
      buildAdditional(undefined, mergeElements(repeated, leftovers(buckets))),
    ),
  };
}

function normalizeField(
  element: XmlElement,
  location: string,
  sectionId: string,
  groupId: string,
): SystemField {
  const id = requireId(element, location);
  const { promoted, additionalAttributes } = splitAttributes(
    element,
    SHARED_SYSTEM_XML_ATTRIBUTES,
  );
  const buckets = bucketChildren(element);

  const repeated = new Map<string, XmlNodeValue | XmlNodeValue[]>();
  const options = takeOptions(buckets);
  const depends = takeDepends(buckets, location);
  const requires = takeRequires(buckets, location);
  const attributeNodes = takeAttributeNodes(buckets, location);
  const sourceService = takeSourceService(buckets);
  const configPath = takeText(buckets, 'config_path', repeated);

  return {
    id,
    ...sharedAttributeSpread(promoted),
    ...optional('additionalAttributes', additionalAttributes),
    ...optional('label', takeText(buckets, 'label', repeated)),
    ...optional('comment', takeText(buckets, 'comment', repeated)),
    ...optional('tooltip', takeText(buckets, 'tooltip', repeated)),
    ...optional('hint', takeText(buckets, 'hint', repeated)),
    ...optional('default', takeText(buckets, 'default', repeated)),
    ...optional('frontendClass', takeText(buckets, 'frontend_class', repeated)),
    ...optional('frontendModel', takeText(buckets, 'frontend_model', repeated)),
    ...optional('backendModel', takeText(buckets, 'backend_model', repeated)),
    ...optional('sourceModel', takeText(buckets, 'source_model', repeated)),
    configPath: configPath ?? `${sectionId}/${groupId}/${id}`,
    ...optional('validate', takeText(buckets, 'validate', repeated)),
    ...optional('canBeEmpty', takeText(buckets, 'can_be_empty', repeated)),
    ...optional(
      'ifModuleEnabled',
      takeText(buckets, 'if_module_enabled', repeated),
    ),
    ...optional('buttonLabel', takeText(buckets, 'button_label', repeated)),
    ...optional(
      'hideInSingleStoreMode',
      takeText(buckets, 'hide_in_single_store_mode', repeated),
    ),
    ...optional('uploadDir', takeText(buckets, 'upload_dir', repeated)),
    ...optional('baseUrl', takeText(buckets, 'base_url', repeated)),
    ...optional('buttonUrl', takeText(buckets, 'button_url', repeated)),
    ...optional('moreUrl', takeText(buckets, 'more_url', repeated)),
    ...optional('demoUrl', takeText(buckets, 'demo_url', repeated)),
    ...(sourceService ? { sourceService } : {}),
    ...(options.length > 0 ? { options } : {}),
    ...(depends.length > 0 ? { depends } : {}),
    ...(requires ? { requires } : {}),
    ...(attributeNodes.length > 0 ? { attributeNodes } : {}),
    ...additionalSpread(
      buildAdditional(undefined, mergeElements(repeated, leftovers(buckets))),
    ),
  };
}

function sharedAttributeSpread(
  promoted: Record<string, string>,
): Partial<SystemField> {
  return {
    ...optional('translate', promoted.translate),
    ...optional('type', promoted.type),
    ...optional('sortOrder', promoted.sortOrder),
    ...optional('showInDefault', promoted.showInDefault),
    ...optional('showInWebsite', promoted.showInWebsite),
    ...optional('showInStore', promoted.showInStore),
    ...optional('canRestore', promoted.canRestore),
    ...optional('advanced', promoted.advanced),
    ...optional('extends', promoted.extends),
  };
}

function splitAttributes(
  element: XmlElement,
  known: readonly string[],
): {
  promoted: Record<string, string>;
  additionalAttributes?: Record<string, string>;
} {
  const knownNames = new Set<string>(['id', ...known]);
  const promoted: Record<string, string> = {};
  const additional: Record<string, string> = {};

  for (const name of Object.keys(element.attributes).sort((a, b) =>
    a.localeCompare(b),
  )) {
    if (isNamespaceAttribute(name)) {
      continue;
    }
    const value = element.attributes[name];
    if (value === undefined) {
      continue;
    }
    if (knownNames.has(name)) {
      promoted[name] = value;
    } else {
      additional[name] = value;
    }
  }

  return {
    promoted,
    ...(Object.keys(additional).length > 0
      ? { additionalAttributes: additional }
      : {}),
  };
}

function takeText(
  buckets: Map<string, XmlElement[]>,
  name: string,
  repeated: Map<string, XmlNodeValue | XmlNodeValue[]>,
): TextOrAttributed | undefined {
  const items = takeAll(buckets, name);
  if (items.length === 0) {
    return undefined;
  }
  if (items.length > 1) {
    repeated.set(
      name,
      items.map((item) => elementToValue(item)),
    );
  }
  return toTextOrAttributed(items[0]!);
}

function takeOptions(buckets: Map<string, XmlElement[]>): SystemOption[] {
  const blocks = takeAll(buckets, 'options');
  const options: SystemOption[] = [];
  for (const block of blocks) {
    for (const child of block.children) {
      if (child.name !== 'option') {
        continue;
      }
      const { promoted, additionalAttributes } = splitAttributes(child, [
        'label',
      ]);
      const option: SystemOption = {
        value: child.text ?? '',
        ...optional('label', promoted.label),
        ...optional('additionalAttributes', additionalAttributes),
      };
      options.push(option);
    }
  }
  return options;
}

function takeDepends(
  buckets: Map<string, XmlElement[]>,
  location: string,
): SystemDependency[] {
  const blocks = takeAll(buckets, 'depends');
  const dependencies: SystemDependency[] = [];
  for (const block of blocks) {
    for (const [index, child] of block.children.entries()) {
      if (child.name !== 'field') {
        continue;
      }
      const id = child.attributes.id;
      if (!id) {
        throw new Error(
          `${location} dependency ${index + 1} is missing required attribute "id".`,
        );
      }
      const { additionalAttributes } = splitAttributes(child, [
        'negative',
        'separator',
      ]);
      dependencies.push({
        id,
        ...optional('value', child.text),
        ...optional('negative', child.attributes.negative),
        ...optional('separator', child.attributes.separator),
        ...optional('additionalAttributes', additionalAttributes),
      });
    }
  }
  return dependencies;
}

function takeRequires(
  buckets: Map<string, XmlElement[]>,
  location: string,
): SystemRequires | undefined {
  const blocks = takeAll(buckets, 'requires');
  if (blocks.length === 0) {
    return undefined;
  }

  const requires: SystemRequires = { fields: [], groups: [] };
  for (const block of blocks) {
    for (const [index, child] of block.children.entries()) {
      const id = child.attributes.id;
      if (!id) {
        throw new Error(
          `${location} requires ${child.name} ${index + 1} is missing required attribute "id".`,
        );
      }
      if (child.name === 'field') {
        requires.fields.push({
          id,
          ...optional('value', child.text),
        });
      } else if (child.name === 'group') {
        requires.groups.push({ id });
      }
    }
  }

  return requires;
}

function takeAttributeNodes(
  buckets: Map<string, XmlElement[]>,
  location: string,
): SystemAttributeNode[] {
  return takeAll(buckets, 'attribute').map((element, index) => {
    const type = element.attributes.type;
    if (!type) {
      throw new Error(
        `${location} attribute ${index + 1} is missing required attribute "type".`,
      );
    }
    const { additionalAttributes } = splitAttributes(element, ['type']);
    return {
      type,
      ...optional('value', element.text),
      ...optional('additionalAttributes', additionalAttributes),
      ...(element.children.length > 0
        ? { children: childrenRecord(element.children) }
        : {}),
    };
  });
}

function takeSourceService(
  buckets: Map<string, XmlElement[]>,
): SourceService | undefined {
  const items = takeAll(buckets, 'source_service');
  const element = items[0];
  if (!element) {
    return undefined;
  }

  const known = ['idField', 'labelField', 'includeEmptyValueOption'];
  const { promoted, additionalAttributes } = splitAttributes(element, known);
  return {
    value: element.text ?? '',
    ...optional('idField', promoted.idField),
    ...optional('labelField', promoted.labelField),
    ...optional('includeEmptyValueOption', promoted.includeEmptyValueOption),
    ...optional('additionalAttributes', additionalAttributes),
  };
}

function readInclude(element: XmlElement, location: string): string {
  const includePath = element.attributes.path;
  if (!includePath) {
    throw new Error(`${location} is missing required attribute "path".`);
  }
  return includePath;
}

function requireId(element: XmlElement, location: string): string {
  const id = element.attributes.id;
  if (!id) {
    throw new Error(`${location} is missing required attribute "id".`);
  }
  return id;
}

function bucketChildren(element: XmlElement): Map<string, XmlElement[]> {
  const buckets = new Map<string, XmlElement[]>();
  for (const child of element.children) {
    const list = buckets.get(child.name);
    if (list) {
      list.push(child);
    } else {
      buckets.set(child.name, [child]);
    }
  }
  return buckets;
}

function takeAll(
  buckets: Map<string, XmlElement[]>,
  name: string,
): XmlElement[] {
  const items = buckets.get(name) ?? [];
  buckets.delete(name);
  return items;
}

function leftovers(
  buckets: Map<string, XmlElement[]>,
): Record<string, XmlNodeValue | XmlNodeValue[]> | undefined {
  if (buckets.size === 0) {
    return undefined;
  }

  const record: Record<string, XmlNodeValue | XmlNodeValue[]> = {};
  for (const [name, items] of buckets) {
    record[name] =
      items.length === 1 && items[0]
        ? elementToValue(items[0])
        : items.map((item) => elementToValue(item));
  }
  return record;
}

function mergeElements(
  repeated: Map<string, XmlNodeValue | XmlNodeValue[]>,
  unknown: Record<string, XmlNodeValue | XmlNodeValue[]> | undefined,
): Record<string, XmlNodeValue | XmlNodeValue[]> | undefined {
  if (repeated.size === 0 && !unknown) {
    return undefined;
  }

  return {
    ...Object.fromEntries(repeated),
    ...unknown,
  };
}

function buildAdditional(
  attributes: Record<string, string> | undefined,
  elements: Record<string, XmlNodeValue | XmlNodeValue[]> | undefined,
): AdditionalContent | undefined {
  if (!attributes && !elements) {
    return undefined;
  }

  return {
    ...(attributes ? { attributes } : {}),
    ...(elements ? { elements } : {}),
  };
}

function additionalSpread(additional: AdditionalContent | undefined): {
  additional?: AdditionalContent;
} {
  return additional ? { additional } : {};
}

function toTextOrAttributed(element: XmlElement): TextOrAttributed {
  const attributes = namespaceFree(element.attributes);
  const value = element.text ?? '';
  if (Object.keys(attributes).length === 0 && element.children.length === 0) {
    return value;
  }

  const result: {
    value: string;
    attributes?: Record<string, string>;
    children?: Record<string, XmlNodeValue | XmlNodeValue[]>;
  } = { value };
  if (Object.keys(attributes).length > 0) {
    result.attributes = sortRecord(attributes);
  }
  if (element.children.length > 0) {
    result.children = childrenRecord(element.children);
  }
  return result;
}

function elementToValue(element: XmlElement): XmlNodeValue {
  const attributes = sortRecord(namespaceFree(element.attributes));
  const hasAttributes = Object.keys(attributes).length > 0;
  const hasChildren = element.children.length > 0;
  const value = element.text ?? '';
  if (!hasAttributes && !hasChildren) {
    return value;
  }

  const node: {
    value?: string;
    attributes?: Record<string, string>;
    children?: Record<string, XmlNodeValue | XmlNodeValue[]>;
  } = {};
  if (value.length > 0 || !hasChildren) {
    node.value = value;
  }
  if (hasAttributes) {
    node.attributes = attributes;
  }
  if (hasChildren) {
    node.children = childrenRecord(element.children);
  }
  return node;
}

function childrenRecord(
  children: XmlElement[],
): Record<string, XmlNodeValue | XmlNodeValue[]> {
  const record: Record<string, XmlNodeValue | XmlNodeValue[]> = {};
  for (const child of children) {
    const value = elementToValue(child);
    const existing = record[child.name];
    if (existing === undefined) {
      record[child.name] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      record[child.name] = [existing, value];
    }
  }
  return record;
}

function namespaceFree(
  attributes: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (!isNamespaceAttribute(name)) {
      result[name] = value;
    }
  }
  return result;
}

function isNamespaceAttribute(name: string): boolean {
  return (
    name === 'xmlns' || name.startsWith('xmlns:') || name.startsWith('xsi:')
  );
}

function sortRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function optional<K extends string, V>(
  key: K,
  value: V | undefined,
): Partial<Record<K, V>> {
  if (value === undefined) {
    return {};
  }
  return { [key]: value } as Partial<Record<K, V>>;
}
