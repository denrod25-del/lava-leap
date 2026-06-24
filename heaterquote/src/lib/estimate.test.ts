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
  const base = {
    location: "outside",
    systemType: "tank",
    fuelType: "electric",
    currentIssue: "old",
    urgency: "researching",
  } as const;

  it("suggests only a permit in the simplest case", () => {
    expect(suggestAddOns(base)).toEqual(["permit"]);
  });

  it("suggests an expansion tank for gas, not electric", () => {
    expect(suggestAddOns({ ...base, fuelType: "gas" })).toContain(
      "expansion_tank"
    );
    expect(suggestAddOns({ ...base, fuelType: "electric" })).not.toContain(
      "expansion_tank"
    );
  });

  it("suggests drain pan + difficult access in an attic", () => {
    const s = suggestAddOns({ ...base, location: "attic" });
    expect(s).toContain("drain_pan");
    expect(s).toContain("difficult_access");
  });

  it("suggests a drain pan for tankless regardless of location", () => {
    expect(
      suggestAddOns({ ...base, location: "outside", systemType: "tankless" })
    ).toContain("drain_pan");
  });

  it("suggests a stand for any garage install", () => {
    expect(
      suggestAddOns({ ...base, location: "garage", fuelType: "electric" })
    ).toContain("stand");
    expect(
      suggestAddOns({ ...base, location: "garage", fuelType: "gas" })
    ).toContain("stand");
  });

  it("suggests emergency service for urgency=today or a failure", () => {
    expect(suggestAddOns({ ...base, urgency: "today" })).toContain(
      "emergency_same_day"
    );
    expect(suggestAddOns({ ...base, currentIssue: "leaking" })).toContain(
      "emergency_same_day"
    );
    expect(suggestAddOns({ ...base, currentIssue: "no_hot_water" })).toContain(
      "emergency_same_day"
    );
    expect(suggestAddOns({ ...base, currentIssue: "upgrading" })).not.toContain(
      "emergency_same_day"
    );
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
