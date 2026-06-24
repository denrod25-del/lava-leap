// Pure, framework-free estimate logic for HeaterQuote.
// Keeping this isolated makes it easy to unit-test and reuse on client + server.

export type SystemType = "tank" | "tankless";
export type TanklessType = "replacement" | "conversion";
export type FuelType = "gas" | "electric";
export type HeaterLocation =
  | "garage"
  | "closet"
  | "attic"
  | "laundry"
  | "outside";
export type CurrentIssue =
  | "leaking"
  | "no_hot_water"
  | "old"
  | "upgrading"
  | "other";
export type Urgency = "today" | "this_week" | "researching";
export type AddOnKey =
  | "permit"
  | "expansion_tank"
  | "drain_pan"
  | "stand"
  | "difficult_access"
  | "emergency_same_day";

export interface Range {
  low: number;
  high: number;
}

export interface EstimateInput {
  currentSystem: SystemType; // what the homeowner has installed today
  systemType: SystemType; // what they want installed
  fuelType: FuelType;
  addOns: AddOnKey[];
}

export interface LineItem {
  key: string;
  label: string;
  range: Range;
}

export interface EstimateResult {
  low: number;
  high: number;
  base: LineItem;
  addOns: LineItem[];
  lineItems: LineItem[];
}

// Base installation ranges (USD).
export const BASE_RANGES: Record<string, { label: string; range: Range }> = {
  electric_tank: { label: "Electric tank water heater", range: { low: 1500, high: 2300 } },
  gas_tank: { label: "Gas tank water heater", range: { low: 1800, high: 2800 } },
  tankless_replacement: {
    label: "Tankless replacement",
    range: { low: 3200, high: 5500 },
  },
  tankless_conversion: {
    label: "Tankless conversion (from a tank)",
    range: { low: 4500, high: 8500 },
  },
};

// Optional add-ons (USD) that depend on site conditions / code requirements.
export const ADD_ONS: Record<
  AddOnKey,
  { label: string; range: Range; description: string }
> = {
  permit: {
    label: "Permit",
    range: { low: 150, high: 350 },
    description: "Required by most Florida municipalities for a replacement.",
  },
  expansion_tank: {
    label: "Expansion tank",
    range: { low: 250, high: 500 },
    description: "Often required on closed plumbing systems by code.",
  },
  drain_pan: {
    label: "Drain pan",
    range: { low: 150, high: 350 },
    description: "Required when the heater is in a living space, attic, or closet.",
  },
  stand: {
    label: "Stand / platform",
    range: { low: 150, high: 400 },
    description: "Needed in garages where the burner must be elevated.",
  },
  difficult_access: {
    label: "Difficult access",
    range: { low: 300, high: 900 },
    description: "Tight closets, attics, or long carry paths add labor.",
  },
  emergency_same_day: {
    label: "Emergency / same-day service",
    range: { low: 200, high: 600 },
    description: "Priority dispatch when you have no hot water today.",
  },
};

export function baseKey(input: EstimateInput): keyof typeof BASE_RANGES {
  if (input.systemType === "tank") {
    return input.fuelType === "electric" ? "electric_tank" : "gas_tank";
  }
  // Tankless: it's a conversion if they currently have a tank, otherwise a
  // like-for-like tankless replacement.
  return input.currentSystem === "tank"
    ? "tankless_conversion"
    : "tankless_replacement";
}

// Whether the job is a tankless replacement or conversion — derived from the
// current vs. desired system. Returns null when the new system is a tank.
export function derivedTanklessType(
  input: Pick<EstimateInput, "currentSystem" | "systemType">
): TanklessType | null {
  if (input.systemType !== "tankless") return null;
  return input.currentSystem === "tank" ? "conversion" : "replacement";
}

// Auto-suggest the add-ons that typically apply, based on the answers the
// homeowner already gave. The form pre-checks these but lets them edit any.
export function suggestAddOns(args: {
  location: string;
  fuelType: FuelType;
  urgency: string;
}): AddOnKey[] {
  const suggested = new Set<AddOnKey>();

  // A permit is required for a replacement in virtually every FL municipality.
  suggested.add("permit");

  // A drain pan is required when the heater sits in or above living space.
  if (["attic", "closet", "laundry"].includes(args.location)) {
    suggested.add("drain_pan");
  }

  // Tight or elevated spots add labor.
  if (["attic", "closet"].includes(args.location)) {
    suggested.add("difficult_access");
  }

  // Gas units in a garage typically need the burner elevated on a stand.
  if (args.location === "garage" && args.fuelType === "gas") {
    suggested.add("stand");
  }

  // No hot water and need it today -> priority same-day dispatch.
  if (args.urgency === "today") {
    suggested.add("emergency_same_day");
  }

  // Keep a stable, predictable order.
  return (Object.keys(ADD_ONS) as AddOnKey[]).filter((k) => suggested.has(k));
}

export function calculateEstimate(input: EstimateInput): EstimateResult {
  const key = baseKey(input);
  const baseDef = BASE_RANGES[key];
  const base: LineItem = { key, label: baseDef.label, range: baseDef.range };

  const addOns: LineItem[] = [];
  // De-dupe and keep a stable, predictable order.
  const seen = new Set<AddOnKey>();
  (Object.keys(ADD_ONS) as AddOnKey[]).forEach((k) => {
    if (input.addOns.includes(k) && !seen.has(k)) {
      seen.add(k);
      addOns.push({ key: k, label: ADD_ONS[k].label, range: ADD_ONS[k].range });
    }
  });

  const lineItems = [base, ...addOns];
  const low = lineItems.reduce((sum, li) => sum + li.range.low, 0);
  const high = lineItems.reduce((sum, li) => sum + li.range.high, 0);

  return { low, high, base, addOns, lineItems };
}

export function formatUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export const DISCLAIMER =
  "This is an estimated range. Final pricing depends on site conditions, code requirements, material availability, and inspection requirements.";
