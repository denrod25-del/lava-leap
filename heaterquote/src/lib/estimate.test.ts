import { describe, it, expect } from "vitest";
import {
  calculateEstimate,
  baseKey,
  derivedTanklessType,
  suggestAddOns,
} from "./estimate";

describe("baseKey", () => {
  it("maps tank + electric to electric_tank", () => {
    expect(
      baseKey({
        currentSystem: "tank",
        systemType: "tank",
        fuelType: "electric",
        addOns: [],
      })
    ).toBe("electric_tank");
  });

  it("maps tank + gas to gas_tank", () => {
    expect(
      baseKey({
        currentSystem: "tank",
        systemType: "tank",
        fuelType: "gas",
        addOns: [],
      })
    ).toBe("gas_tank");
  });

  it("treats tankless-now -> tankless as a replacement", () => {
    expect(
      baseKey({
        currentSystem: "tankless",
        systemType: "tankless",
        fuelType: "gas",
        addOns: [],
      })
    ).toBe("tankless_replacement");
  });

  it("treats tank-now -> tankless as a conversion", () => {
    expect(
      baseKey({
        currentSystem: "tank",
        systemType: "tankless",
        fuelType: "gas",
        addOns: [],
      })
    ).toBe("tankless_conversion");
  });
});

describe("derivedTanklessType", () => {
  it("is null when the new system is a tank", () => {
    expect(
      derivedTanklessType({ currentSystem: "tankless", systemType: "tank" })
    ).toBeNull();
  });

  it("is conversion from tank, replacement from tankless", () => {
    expect(
      derivedTanklessType({ currentSystem: "tank", systemType: "tankless" })
    ).toBe("conversion");
    expect(
      derivedTanklessType({ currentSystem: "tankless", systemType: "tankless" })
    ).toBe("replacement");
  });
});

describe("suggestAddOns", () => {
  it("always suggests a permit", () => {
    expect(
      suggestAddOns({ location: "outside", fuelType: "electric", urgency: "researching" })
    ).toEqual(["permit"]);
  });

  it("suggests drain pan + difficult access in an attic", () => {
    const s = suggestAddOns({
      location: "attic",
      fuelType: "electric",
      urgency: "this_week",
    });
    expect(s).toContain("drain_pan");
    expect(s).toContain("difficult_access");
  });

  it("suggests a stand only for gas in a garage", () => {
    expect(
      suggestAddOns({ location: "garage", fuelType: "gas", urgency: "this_week" })
    ).toContain("stand");
    expect(
      suggestAddOns({ location: "garage", fuelType: "electric", urgency: "this_week" })
    ).not.toContain("stand");
  });

  it("suggests emergency service when urgency is today", () => {
    expect(
      suggestAddOns({ location: "garage", fuelType: "gas", urgency: "today" })
    ).toContain("emergency_same_day");
  });
});

describe("calculateEstimate", () => {
  it("returns the base range with no add-ons", () => {
    const r = calculateEstimate({
      currentSystem: "tank",
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
      currentSystem: "tank",
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
      currentSystem: "tank",
      systemType: "tank",
      fuelType: "gas",
      addOns: ["permit", "permit"],
    });
    expect(r.addOns).toHaveLength(1);
    expect(r.low).toBe(1800 + 150);
  });

  it("handles a full tank -> tankless conversion with all add-ons", () => {
    const r = calculateEstimate({
      currentSystem: "tank",
      systemType: "tankless",
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
