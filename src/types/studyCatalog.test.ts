import { describe, expect, it } from "vitest";
import { Study, addEmne, addProgram, addStudy, emneIdRemap, findEmne, getStudies, updateEmne, emneMeta, migrateCatalogV2, migrateCatalogV3, programLabel, remapEmneId, validateEmne, validateProgram } from "./studyCatalog";

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

  it("makes the requirement mandatory once Emne requirements is ticked", () => {
    expect(validateEmne({ name: "X" }, [])).toEqual([]); // not ticked: undefined
    expect(validateEmne({ name: "X", requirement: "" }, [])).toHaveLength(1);
    expect(validateEmne({ name: "X", requirement: "   " }, [])).toHaveLength(1);
    expect(validateEmne({ name: "X", requirement: "Two students together" }, [])).toEqual([]);
    expect(validateEmne({ name: "X", requirement: "x".repeat(301) }, [])).toHaveLength(1);
  });

  it("labels", () => {
    expect(programLabel({ name: "Sykepleie", code: "SYK" })).toBe("Sykepleie (SYK)");
    expect(programLabel({ name: "Sykepleie" })).toBe("Sykepleie");
    expect(emneMeta({ term: 3, code: "NSK201", subject: "Medical ward", requirement: "Two students together", startTerm: "2026 Høst" })).toEqual([
      "Term 3", "NSK201", "Medical ward", "Start 2026 Høst",
    ]); // the requirement is shown on its own line
    expect(emneMeta({})).toEqual([]);
  });
});

describe("study catalog v3", () => {
  it("dates the VFU courses in 2026 and merges the same season of two years, remembering the id that went", () => {
    emneIdRemap.clear();
    const [s] = migrateCatalogV3([
      study([
        { id: "a", name: "VFU HT 2022", startTerm: "HT 2022" },
        { id: "b", name: "VFU HT 2023", startTerm: "HT 2023" },
        { id: "c", name: "VFU VT 2023", startTerm: "VT 2023" },
        { id: "d", name: "Praksis 1" },
      ]),
    ]);
    expect(s.programs[0].emner).toEqual([
      { id: "a", name: "VFU HT 2026", startTerm: "HT 2026" },
      { id: "c", name: "VFU VT 2026", startTerm: "VT 2026" },
      { id: "d", name: "Praksis 1" },
    ]);
    expect(remapEmneId("b")).toBe("a");
    expect(remapEmneId("a")).toBe("a");
    expect(remapEmneId("zzz")).toBe("zzz");
  });

  it("leaves programs without emner, and a catalog that is already in 2026", () => {
    expect(migrateCatalogV3([study(undefined)])[0].programs[0].emner).toBeUndefined();
    const done = [study([{ id: "a", name: "VFU HT 2026", startTerm: "HT 2026" }])];
    expect(migrateCatalogV3(done)).toEqual(done);
  });
});

describe("emne requirement in the store", () => {
  it("is saved with the emne, trimmed, and removed when the box is unticked or the emne is edited without it", () => {
    addStudy("Requirement study");
    const study = getStudies().find((x) => x.name === "Requirement study")!;
    addProgram(study.id, "Req program");
    const program = getStudies().find((x) => x.id === study.id)!.programs[0];
    addEmne(study.id, program.id, { name: "Praksis", requirement: "  Two students together  " });
    const emne = () => findEmne(program.id, getStudies().find((x) => x.id === study.id)!.programs[0].emner![0].id)!.emne;
    expect(emne().requirement).toBe("Two students together");
    updateEmne(study.id, program.id, emne().id, { name: "Praksis", requirement: "One supervisor per student" });
    expect(emne().requirement).toBe("One supervisor per student");
    updateEmne(study.id, program.id, emne().id, { name: "Praksis" });
    expect(emne()).not.toHaveProperty("requirement");
  });
});
