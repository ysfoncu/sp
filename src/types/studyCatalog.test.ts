import { describe, expect, it } from "vitest";
import { Study, emneMeta, migrateCatalogV2, programLabel, validateEmne, validateProgram } from "./studyCatalog";

const study = (emner: Study["programs"][number]["emner"]): Study => ({
  id: "s1",
  name: "Helse",
  universityId: "U1",
  universityName: "UiO",
  programs: [{ id: "p1", name: "Sykepleie", emner }],
});

describe("study catalog v2", () => {
  it("turns a 'Kull' emne into a start term and keeps its id and name", () => {
    const [s] = migrateCatalogV2([study([{ id: "e1", name: "Kull 2026 Høst" }, { id: "e2", name: "Praksis 1" }])]);
    expect(s.programs[0].emner).toEqual([
      { id: "e1", name: "Kull 2026 Høst", startTerm: "2026 Høst" },
      { id: "e2", name: "Praksis 1" },
    ]);
  });

  it("leaves a start term that is already set, and programs without emner", () => {
    const [s] = migrateCatalogV2([study([{ id: "e1", name: "kull 2027 Vår", startTerm: "2027 Vår (late)" }]), ]);
    expect(s.programs[0].emner![0].startTerm).toBe("2027 Vår (late)");
    expect(migrateCatalogV2([study(undefined)])[0].programs[0].emner).toBeUndefined();
  });
});

describe("emne and program rules", () => {
  const others = [{ id: "e1", name: "Praksis 1", code: "NSK101" }, { id: "e2", name: "Old", code: "OLD1", archived: true }];

  it("needs a name that is free in the program", () => {
    expect(validateEmne({ name: " " }, others)).toEqual(["Give the emne a name"]);
    expect(validateEmne({ name: "praksis 1" }, others)).toEqual(["This program already has an emne with this name"]);
    expect(validateEmne({ name: "Praksis 2" }, others)).toEqual([]);
  });

  it("keeps codes unique among active emner only", () => {
    expect(validateEmne({ name: "X", code: "nsk101" }, others)).toEqual(["Another emne of this program has this code"]);
    expect(validateEmne({ name: "X", code: "OLD1" }, others)).toEqual([]);
    expect(validateEmne({ name: "X", code: "" }, others)).toEqual([]);
  });

  it("keeps the term between 1 and 12", () => {
    expect(validateEmne({ name: "X", term: 0 }, [])).toHaveLength(1);
    expect(validateEmne({ name: "X", term: 13 }, [])).toHaveLength(1);
    expect(validateEmne({ name: "X", term: 2.5 }, [])).toHaveLength(1);
    expect(validateEmne({ name: "X", term: 3 }, [])).toEqual([]);
  });

  it("checks program name and code against the study's other programs", () => {
    const programs = [{ id: "p1", name: "Sykepleie", code: "SYK" }];
    expect(validateProgram({ name: "sykepleie" }, programs)).toHaveLength(1);
    expect(validateProgram({ name: "Fysio", code: "syk" }, programs)).toHaveLength(1);
    expect(validateProgram({ name: "Fysio", code: "FYS" }, programs)).toEqual([]);
  });

  it("labels", () => {
    expect(programLabel({ name: "Sykepleie", code: "SYK" })).toBe("Sykepleie (SYK)");
    expect(programLabel({ name: "Sykepleie" })).toBe("Sykepleie");
    expect(emneMeta({ term: 3, code: "NSK201", subject: "Medical ward", pairPlacement: true, startTerm: "2026 Høst" })).toEqual([
      "Term 3", "NSK201", "Medical ward", "Pair placement", "Start 2026 Høst",
    ]);
    expect(emneMeta({})).toEqual([]);
  });
});
