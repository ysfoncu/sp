import { describe, expect, it } from "vitest";
import { EMPTY_TAGS, MAX_TAG_NAME, TAG_COLORS, addTag, hasAnyTag, removeTag, tagCount, tagOn, tagsOf, toggleTag, validateTagName } from "./studentTags";

const make = (names: string[]) => names.reduce((s, n, i) => addTag(s, n, `t${i + 1}`).state, EMPTY_TAGS);

describe("student tags", () => {
  it("makes tags with a trimmed, unique name and the next colour of the palette", () => {
    const s = make(["Night shift", "  Car  "]);
    expect(s.tags.map((t) => [t.id, t.name, t.color])).toEqual([["t1", "Night shift", TAG_COLORS[0]], ["t2", "Car", TAG_COLORS[1]]]);
    expect(addTag(s, "night SHIFT").error).toMatch(/exists/);
    expect(addTag(s, "   ").error).toMatch(/name/);
    expect(validateTagName("x".repeat(MAX_TAG_NAME + 1), s.tags)).toMatch(/at most/i);
    expect(validateTagName("x".repeat(MAX_TAG_NAME), s.tags)).toBeNull();
  });

  it("puts several tags on a student and several students under a tag", () => {
    let s = make(["A", "B"]);
    s = toggleTag(s, ["s1", "s2"], "t1");
    s = toggleTag(s, ["s1"], "t2");
    expect(tagsOf(s, "s1").map((t) => t.name)).toEqual(["A", "B"]);
    expect(tagsOf(s, "s2").map((t) => t.name)).toEqual(["A"]);
    expect(tagsOf(s, "s3")).toEqual([]);
    expect(tagCount(s, ["s1", "s2", "s3"], "t1")).toBe(2);
  });

  it("toggles on all students unless they all have it, then takes it off all", () => {
    let s = make(["A"]);
    s = toggleTag(s, ["s1"], "t1");
    expect(tagOn(s, ["s1", "s2"], "t1")).toBe("some");
    s = toggleTag(s, ["s1", "s2"], "t1"); // some have it: all get it
    expect(tagOn(s, ["s1", "s2"], "t1")).toBe("all");
    s = toggleTag(s, ["s1", "s2"], "t1"); // all have it: none keep it
    expect(tagOn(s, ["s1", "s2"], "t1")).toBe("none");
    expect(s.byStudent).toEqual({});
    expect(toggleTag(s, [], "t1")).toBe(s);
  });

  it("filters by any of the picked tags, and shows everyone when none is picked", () => {
    let s = make(["A", "B", "C"]);
    s = toggleTag(s, ["s1"], "t1");
    s = toggleTag(s, ["s2"], "t2");
    expect(["s1", "s2", "s3"].filter((id) => hasAnyTag(s, id, []))).toEqual(["s1", "s2", "s3"]);
    expect(["s1", "s2", "s3"].filter((id) => hasAnyTag(s, id, ["t1"]))).toEqual(["s1"]);
    expect(["s1", "s2", "s3"].filter((id) => hasAnyTag(s, id, ["t1", "t2"]))).toEqual(["s1", "s2"]);
    expect(["s1", "s2", "s3"].filter((id) => hasAnyTag(s, id, ["t3"]))).toEqual([]);
  });

  it("deleting a tag takes it off every student and drops students left with none", () => {
    let s = make(["A", "B"]);
    s = toggleTag(s, ["s1", "s2"], "t1");
    s = toggleTag(s, ["s1"], "t2");
    const after = removeTag(s, "t1");
    expect(after.tags.map((t) => t.id)).toEqual(["t2"]);
    expect(after.byStudent).toEqual({ s1: ["t2"] });
  });
});
