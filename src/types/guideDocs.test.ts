import { describe, expect, it } from "vitest";
import { formatGuideHash, guideHeadings, guideImages, neighbours, parseGuideDoc, parseGuideHash, slugify, sortGuideDocs } from "./guideDocs";

const raw = `---
id: ts-03
title: "Test Scenario 03 — Priorities"
short: 03 · Priorities
order: 3
page: Priorities
minutes: 12
---
Intro text.

## Steps

### 1. Open Priorities
Click **Priorities**.

![Priorities list](/guide/ts-03/01-list.png)

\`\`\`
## not a heading
\`\`\`

## For the researcher
- Did they find it?
`;

describe("guide pages", () => {
  it("reads the front matter, the text and the researcher part", () => {
    const d = parseGuideDoc(raw, "x");
    expect(d).toMatchObject({ id: "ts-03", title: "Test Scenario 03 — Priorities", short: "03 · Priorities", order: 3, page: "Priorities", minutes: "12" });
    expect(d.body).toContain("Click **Priorities**.");
    expect(d.body).not.toContain("Did they find it?");
    expect(d.researcher).toBe("- Did they find it?");
  });
  it("copes with no front matter and no researcher part", () => {
    const d = parseGuideDoc("# Hello\ntext", "start");
    expect(d).toMatchObject({ id: "start", title: "start", order: 99, researcher: "" });
    expect(d.body).toBe("# Hello\ntext");
  });
  it("keeps order 0 (the first page)", () => {
    expect(parseGuideDoc("---\norder: 0\n---\n", "s").order).toBe(0);
  });
  it("orders the pages and finds the neighbours", () => {
    const docs = sortGuideDocs([parseGuideDoc("---\norder: 2\nid: b\n---\n", "b"), parseGuideDoc("---\norder: 1\nid: a\n---\n", "a"), parseGuideDoc("---\norder: 3\nid: c\n---\n", "c")]);
    expect(docs.map((d) => d.id)).toEqual(["a", "b", "c"]);
    expect(neighbours(docs, "b")).toMatchObject({ prev: { id: "a" }, next: { id: "c" } });
    expect(neighbours(docs, "a").prev).toBeUndefined();
    expect(neighbours(docs, "nope")).toEqual({});
  });
  it("lists the headings outside code blocks, with slugs", () => {
    const h = guideHeadings(parseGuideDoc(raw, "x").body);
    expect(h).toEqual([
      { level: 2, text: "Steps", slug: "steps" },
      { level: 3, text: "1. Open Priorities", slug: "1-open-priorities" },
    ]);
    expect(slugify("Final result")).toBe("final-result");
  });
  it("turns hashes into pages and back", () => {
    expect(parseGuideHash("#/guide/ts-03")).toBe("ts-03");
    expect(parseGuideHash("#/guide")).toBe("");
    expect(parseGuideHash("#/places/x")).toBeNull();
    expect(formatGuideHash("ts-03")).toBe("#/guide/ts-03");
    expect(formatGuideHash("")).toBe("#/guide");
  });
  it("lists the images a page uses", () => {
    expect(guideImages(parseGuideDoc(raw, "x").body)).toEqual(["/guide/ts-03/01-list.png"]);
  });
});
