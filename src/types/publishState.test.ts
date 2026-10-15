import { describe, expect, it } from "vitest";
import { canPublishToStudents, isLocked, normalizePublish, publishState, publishedTaskIds } from "./publishState";
import { placementTasks } from "./placementTask";

describe("publish state", () => {
  it("is none, entities or students, and students win", () => {
    expect(publishState({})).toBe("none");
    expect(publishState({ entitiesPublished: false, assignmentPublished: false })).toBe("none");
    expect(publishState({ entitiesPublished: true })).toBe("entities");
    expect(publishState({ entitiesPublished: true, assignmentPublished: true })).toBe("students");
    // saved with the single publish step: only the students' flag
    expect(publishState({ assignmentPublished: true })).toBe("students");
    expect(publishState({ entitiesPublished: false, assignmentPublished: true })).toBe("students");
  });
  it("lets students be published only after the entities", () => {
    expect(canPublishToStudents("none")).toBe(false);
    expect(canPublishToStudents("entities")).toBe(true);
    expect(canPublishToStudents("students")).toBe(false);
  });
  it("locks the assignments once anything is published", () => {
    expect([isLocked("none"), isLocked("entities"), isLocked("students")]).toEqual([false, true, true]);
  });
  it("completes task 7 for the entities and 8 for the students", () => {
    expect([publishedTaskIds("none"), publishedTaskIds("entities"), publishedTaskIds("students")]).toEqual([[], ["7"], ["7", "8"]]);
  });
  it("has the two publish tasks last, both mandatory", () => {
    const last = placementTasks.slice(-2);
    expect(last.map((t) => [t.id, t.step, t.status])).toEqual([["7", "6/7", "mandatory"], ["8", "7/7", "mandatory"]]);
    expect(placementTasks.every((t) => t.step.endsWith("/7"))).toBe(true);
  });
});

describe("normalizing a saved task state", () => {
  const base = { completedTasks: ["1", "2", "4"] };
  it("leaves an unpublished state alone", () => {
    expect(normalizePublish(base)).toMatchObject({ entitiesPublished: false, assignmentPublished: false, completedTasks: ["1", "2", "4"] });
  });
  it("counts a placement published to students as published to entities too", () => {
    const s = normalizePublish({ ...base, assignmentPublished: true, assignmentPublishedDate: "1 Jan 2026" });
    expect(s).toMatchObject({ entitiesPublished: true, entitiesPublishedDate: "1 Jan 2026", assignmentPublished: true });
    expect(s.completedTasks).toEqual(expect.arrayContaining(["7", "8"]));
  });
  it("counts task 7 done without 8 and no flags as the old single publish: both published", () => {
    const s = normalizePublish({ completedTasks: ["1", "2", "4", "5", "6", "7"] });
    expect([s.entitiesPublished, s.assignmentPublished]).toEqual([true, true]);
    expect(s.completedTasks).toContain("8");
  });
  it("keeps an entities-only state (task 7 done, entities flag set) as entities only", () => {
    const s = normalizePublish({ completedTasks: ["1", "2", "4", "7"], entitiesPublished: true });
    expect([s.entitiesPublished, s.assignmentPublished]).toEqual([true, false]);
    expect(s.completedTasks).not.toContain("8");
  });
  it("is idempotent", () => {
    const once = normalizePublish({ completedTasks: ["7"], assignmentPublished: true });
    expect(normalizePublish(once)).toEqual(once);
  });
});

import { STEP_INFO, stepInfoTitle } from "./stepInfo";
describe("step info banners", () => {
  it("has a heading, a task and how-to points for every mandatory placement task, and none for the optional ones", () => {
    placementTasks.forEach((t) => {
      const info = STEP_INFO[t.id];
      if (t.status === "optional") return expect(info, `task ${t.id}`).toBeUndefined();
      expect(info, `task ${t.id}`).toBeDefined();
      expect(info.heading.length).toBeGreaterThan(0);
      expect(info.task).toMatch(/^Your task is to /);
      expect(info.points.length).toBeGreaterThan(0);
    });
    expect(placementTasks.filter((t) => t.status === "mandatory").map((t) => t.step)).toEqual(["1/7", "2/7", "3/7", "6/7", "7/7"]);
  });
  it("covers Placement Details (task 1)", () => {
    expect(STEP_INFO["1"].heading).toMatch(/study, program and emne/);
  });
  it("builds the title from the step label", () => {
    expect(stepInfoTitle("3/7", STEP_INFO["4"])).toBe("Step 3 of 7: place the students on entities");
  });
});
