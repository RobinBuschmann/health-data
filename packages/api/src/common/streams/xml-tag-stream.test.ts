import { beforeEach, describe, expect, it } from "vitest";
import { XmlTagStream, type XmlTag } from "./xml-tag-stream.js";

function collectStream(stream: XmlTagStream): Promise<XmlTag[]> {
  return new Promise((resolve, reject) => {
    const items: XmlTag[] = [];
    stream.on("data", (item: XmlTag) => items.push(item));
    stream.on("end", () => resolve(items));
    stream.on("error", reject);
  });
}

function writeXml(xml: string, tagNames: string | string[]): Promise<XmlTag[]> {
  const stream = new XmlTagStream(tagNames);
  const result = collectStream(stream);
  stream.write(Buffer.from(xml));
  stream.end();
  return result;
}

describe("given XML with a single matching tag", () => {
  let result: XmlTag[];

  beforeEach(async () => {
    result = await writeXml("<root><item/></root>", "item");
  });

  it("should emit one tag", () => {
    expect(result).toHaveLength(1);
  });

  it("should emit the correct tag name", () => {
    expect(result[0].name).toBe("item");
  });

  it("should emit empty attributes", () => {
    expect(result[0].attributes).toEqual({});
  });
});

describe("given XML with no matching tags", () => {
  let result: XmlTag[];

  beforeEach(async () => {
    result = await writeXml("<root><other/></root>", "item");
  });

  it("should emit nothing", () => {
    expect(result).toHaveLength(0);
  });
});

describe("given XML with multiple occurrences of the matching tag", () => {
  let result: XmlTag[];

  beforeEach(async () => {
    result = await writeXml("<root><item/><item/><item/></root>", "item");
  });

  it("should emit one tag per occurrence", () => {
    expect(result).toHaveLength(3);
  });

  it("should emit the correct tag name for each", () => {
    expect(result.every((t) => t.name === "item")).toBe(true);
  });
});

describe("given a matching tag with attributes", () => {
  let result: XmlTag[];

  beforeEach(async () => {
    result = await writeXml('<root><item id="42" type="foo"/></root>', "item");
  });

  it("should emit the tag with its attributes", () => {
    expect(result[0].attributes).toEqual({ id: "42", type: "foo" });
  });
});

describe("given multiple tag names to watch", () => {
  let result: XmlTag[];

  beforeEach(async () => {
    result = await writeXml("<root><alpha/><beta/><gamma/></root>", ["alpha", "gamma"]);
  });

  it("should emit tags matching any of the names", () => {
    expect(result).toHaveLength(2);
  });

  it("should emit alpha first", () => {
    expect(result[0].name).toBe("alpha");
  });

  it("should emit gamma second", () => {
    expect(result[1].name).toBe("gamma");
  });

  it("should not emit the unmatched tag", () => {
    expect(result.find((t) => t.name === "beta")).toBeUndefined();
  });
});

describe("given XML written in multiple chunks", () => {
  let result: XmlTag[];

  beforeEach(async () => {
    const stream = new XmlTagStream("item");
    const collected = collectStream(stream);

    const xml = '<root><item id="1"/><item id="2"/></root>';
    const mid = Math.floor(xml.length / 2);

    stream.write(Buffer.from(xml.slice(0, mid)));
    stream.write(Buffer.from(xml.slice(mid)));
    stream.end();

    result = await collected;
  });

  it("should still emit all matching tags", () => {
    expect(result).toHaveLength(2);
  });

  it("should preserve attributes across chunk boundaries", () => {
    expect(result.map((t) => t.attributes.id)).toEqual(["1", "2"]);
  });
});

describe("given a single tag name passed as a string", () => {
  let result: XmlTag[];

  beforeEach(async () => {
    result = await writeXml("<root><item/></root>", "item");
  });

  it("should behave the same as passing a single-element array", async () => {
    const fromArray = await writeXml("<root><item/></root>", ["item"]);
    expect(result).toEqual(fromArray);
  });
});

describe("given invalid XML", () => {
  let error: unknown;

  beforeEach(async () => {
    await writeXml("<root><unclosed>", "item").catch((err) => {
      error = err;
    });
  });

  it("should emit a stream error", () => {
    expect(error).toBeInstanceOf(Error);
  });
});
