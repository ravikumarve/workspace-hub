import { describe, it, expect } from "vitest";
import { stateBadge, tierBadge } from "./api";
import { CONFIG } from "./config";

describe("stateBadge", () => {
  it("maps success", () => expect(stateBadge("Success — done").label).toBe("success"));
  it("maps blocked to red", () => expect(stateBadge("Blocked").cls).toContain("red"));
  it("handles null", () => expect(stateBadge(null).label).toBe("no ledger"));
});

describe("tierBadge", () => {
  it("amber for RUNNING", () => expect(tierBadge("RUNNING").cls).toContain("amber"));
  it("emerald for DONE", () => expect(tierBadge("DONE").cls).toContain("emerald"));
});

describe("CONFIG", () => {
  it("score gate 70", () => expect(CONFIG.scoreGate).toBe(70));
  it("staleness 30", () => expect(CONFIG.stalenessDays).toBe(30));
});
