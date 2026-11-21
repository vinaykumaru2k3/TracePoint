import { describe, expect, it } from "vitest";
import { COURSE, CURRICULUM, folderName } from "./curriculum";

describe("COURSE root", () => {
  it("is the DSA root over the whole curriculum", () => {
    expect(COURSE.name).toBe("DSA");
    expect(COURSE.id).toBe("dsa");
    expect(COURSE.sections).toBe(CURRICULUM);
    expect(COURSE.sections).toHaveLength(10);
  });
  it("names section folders as slug paths", () => {
    expect(folderName(CURRICULUM[0])).toBe("01-foundations/");
    expect(folderName(CURRICULUM[9])).toBe("10-advanced/");
    for (const s of COURSE.sections) expect(folderName(s)).toMatch(/^\d\d-[a-z]+\/$/);
  });
});
