import { describe, expect, it } from "vitest";
import { localIsoDate } from "./localDate";

describe("localIsoDate", () => {
  it("keeps the day that was picked, whatever the time zone", () => {
    expect(localIsoDate(new Date(2026, 9, 22))).toBe("2026-10-22");
    expect(localIsoDate(new Date(2026, 0, 1))).toBe("2026-01-01");
    expect(localIsoDate(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
});
