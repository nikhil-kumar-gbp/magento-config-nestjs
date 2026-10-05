import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { XmlElement } from '@/types/xml-element.types.js';
import {
  ATTRIBUTE_KEY,
  ATTRIBUTE_PREFIX,
  TEXT_KEY,
} from '@/constants/attributes.js';

export class XmlDocumentParser {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ATTRIBUTE_PREFIX,
    textNodeName: TEXT_KEY,
    preserveOrder: true,
    trimValues: true,
    parseTagValue: false,
    parseAttributeValue: false,
    processEntities: true,
  });

  parse(xml: string): XmlElement {
    const sanitized = xml.charCodeAt(0) === 0xfeff ? xml.slice(1) : xml;
    const validation = XMLValidator.validate(sanitized);
    if (validation !== true) {
      throw new Error(
        `Invalid XML at line ${validation.err.line}, column ${validation.err.col}: ${validation.err.msg}`,
      );
    }

    let parsed: unknown;
    try {
      parsed = this.parser.parse(sanitized);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown XML parse failure';
      throw new Error(reason);
    }

    const elements = convertPreserveOrder(parsed);

    if (elements.length === 1 && elements[0]) {
      return elements[0];
    }

    const config = elements.find((element) => element.name === 'config');
    if (!config) {
      throw new Error('Expected a single root element.');
    }

    return config;
  }
}

function convertPreserveOrder(nodes: unknown): XmlElement[] {
  if (!Array.isArray(nodes)) {
    return [];
  }

  const elements: XmlElement[] = [];
  for (const node of nodes) {
    if (!isRecord(node)) {
      continue;
    }

    const tagName = Object.keys(node).find((key) => key !== ATTRIBUTE_KEY);
    if (
      !tagName ||
      tagName === TEXT_KEY ||
      tagName.startsWith('?') ||
      tagName.startsWith('!')
    ) {
      continue;
    }

    const inner = parseInner(node[tagName]);
    elements.push({
      name: tagName,
      attributes: readAttributes(node[ATTRIBUTE_KEY]),
      children: inner.children,
      ...(inner.text !== undefined ? { text: inner.text } : {}),
    });
  }

  return elements;
}

function parseInner(inner: unknown): { text?: string; children: XmlElement[] } {
  if (!Array.isArray(inner)) {
    return { children: [] };
  }

  const texts: string[] = [];
  const elementNodes: unknown[] = [];
  for (const node of inner) {
    if (!isRecord(node)) {
      continue;
    }
    if (TEXT_KEY in node) {
      const text = node[TEXT_KEY];
      if (
        typeof text === 'string' ||
        typeof text === 'number' ||
        typeof text === 'boolean'
      ) {
        texts.push(String(text));
      }
      continue;
    }
    elementNodes.push(node);
  }

  const text = texts.join('').trim();
  return {
    children: convertPreserveOrder(elementNodes),
    ...(text.length > 0 ? { text } : {}),
  };
}

function readAttributes(raw: unknown): Record<string, string> {
  if (!isRecord(raw)) {
    return {};
  }

  const attributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      continue;
    }
    const name = key.startsWith(ATTRIBUTE_PREFIX)
      ? key.slice(ATTRIBUTE_PREFIX.length)
      : key;
    attributes[name] = String(value);
  }

  return attributes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
