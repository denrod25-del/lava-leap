import { describe, it, expect } from "vitest";
import { calculateEstimate, baseKey } from "./estimate";

describe("baseKey", () => {
  it("maps tank + electric to electric_tank", () => {
    expect(
      baseKey({ systemType: "tank", fuelType: "electric", addOns: [] })
    ).toBe("electric_tank");
  });

  it("maps tank + gas to gas_tank", () => {
    expect(
      baseKey({ systemType: "tank", fuelType: "gas", addOns: [] })
    ).toBe("gas_tank");
  });

  it("maps tankless replacement vs conversion", () => {
    expect(
      baseKey({
        systemType: "tankless",
        tanklessType: "replacement",
        fuelType: "gas",
        addOns: [],
      })
    ).toBe("tankless_replacement");
    expect(
      baseKey({
        systemType: "tankless",
        tanklessType: "conversion",
        fuelType: "gas",
        addOns: [],
      })
    ).toBe("tankless_conversion");
  });

  it("defaults tankless with no type to replacement", () => {
    expect(
      baseKey({ systemType: "tankless", fuelType: "gas", addOns: [] })
    ).toBe("tankless_replacement");
  });
});

describe("calculateEstimate", () => {
  it("returns the base range with no add-ons", () => {
    const r = calculateEstimate({
      systemType: "tank",
      fuelType: "electric",
      addOns: [],
    });
    expect(r.low).toBe(1500);
    expect(r.high).toBe(2300);
    expect(r.addOns).toHaveLength(0);
  });

  it("sums add-ons into the range", () => {
    const r = calculateEstimate({
      systemType: "tank",
      fuelType: "gas",
      addOns: ["permit", "expansion_tank"],
    });
    // gas tank 1800-2800 + permit 150-350 + expansion 250-500
    expect(r.low).toBe(1800 + 150 + 250);
    expect(r.high).toBe(2800 + 350 + 500);
    expect(r.lineItems).toHaveLength(3);
  });

  it("de-dupes repeated add-ons", () => {
    const r = calculateEstimate({
      systemType: "tank",
      fuelType: "gas",
      addOns: ["permit", "permit"],
    });
    expect(r.addOns).toHaveLength(1);
    expect(r.low).toBe(1800 + 150);
  });

  it("handles a full tankless conversion with all add-ons", () => {
    const r = calculateEstimate({
      systemType: "tankless",
      tanklessType: "conversion",
      fuelType: "gas",
      addOns: [
        "permit",
        "expansion_tank",
        "drain_pan",
        "stand",
        "difficult_access",
        "emergency_same_day",
      ],
    });
    expect(r.low).toBe(4500 + 150 + 250 + 150 + 150 + 300 + 200);
    expect(r.high).toBe(8500 + 350 + 500 + 350 + 400 + 900 + 600);
  });
});
