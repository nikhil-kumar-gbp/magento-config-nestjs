/** Generic XML tree produced by the document parser. */
export interface XmlElement {
  name: string;
  attributes: Record<string, string>;
  text?: string;
  children: XmlElement[];
}

/** Preserved value for an element that is not part of the known hierarchy. */
export type XmlNodeValue =
  | string
  | {
      value?: string;
      attributes?: Record<string, string>;
      children?: Record<string, XmlNodeValue | XmlNodeValue[]>;
    };

export interface AttributedValue {
  value: string;
  attributes?: Record<string, string>;
  children?: Record<string, XmlNodeValue | XmlNodeValue[]>;
}

export type TextOrAttributed = string | AttributedValue;
