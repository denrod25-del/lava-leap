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
  systemType: SystemType;
  tanklessType?: TanklessType | null;
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
  // Tankless: default to a like-for-like replacement unless converting from a tank.
  return input.tanklessType === "conversion"
    ? "tankless_conversion"
    : "tankless_replacement";
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
