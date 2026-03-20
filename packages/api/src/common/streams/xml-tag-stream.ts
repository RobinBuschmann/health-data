import { Transform, type TransformCallback } from "stream";
import { SaxesParser } from "saxes";

export interface XmlTag {
  name: string;
  attributes: Record<string, string>;
}

export class XmlTagStream extends Transform {
  private readonly parser: SaxesParser;
  private readonly tagNames: Set<string>;

  constructor(tagNames: string | string[]) {
    super({ objectMode: true });
    this.tagNames = new Set(Array.isArray(tagNames) ? tagNames : [tagNames]);
    this.parser = new SaxesParser();

    this.parser.on("opentag", (node) => {
      if (this.tagNames.has(node.name)) {
        this.push({ name: node.name, attributes: node.attributes } satisfies XmlTag);
      }
    });

    this.parser.on("error", (err) => {
      this.destroy(err);
    });
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.parser.write(chunk.toString());
    callback();
  }

  _flush(callback: TransformCallback): void {
    this.parser.close();
    callback();
  }
}
