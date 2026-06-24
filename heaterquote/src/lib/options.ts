// Shared option lists used by the estimator form and admin display labels.

export const SYSTEM_TYPES = [
  { value: "tank", label: "Tank" },
  { value: "tankless", label: "Tankless" },
] as const;

export const FUEL_TYPES = [
  { value: "gas", label: "Gas" },
  { value: "electric", label: "Electric" },
] as const;

export const GALLON_SIZES = [
  { value: "30", label: "30 gallon" },
  { value: "40", label: "40 gallon" },
  { value: "50", label: "50 gallon" },
  { value: "65", label: "65 gallon" },
  { value: "75", label: "75 gallon" },
  { value: "80", label: "80 gallon" },
  { value: "n/a", label: "Not sure / Tankless" },
] as const;

export const LOCATIONS = [
  { value: "garage", label: "Garage" },
  { value: "closet", label: "Closet" },
  { value: "attic", label: "Attic" },
  { value: "laundry", label: "Laundry room" },
  { value: "outside", label: "Outside" },
] as const;

export const CURRENT_ISSUES = [
  { value: "leaking", label: "Leaking" },
  { value: "no_hot_water", label: "No hot water" },
  { value: "old", label: "Old heater" },
  { value: "upgrading", label: "Upgrading" },
  { value: "other", label: "Other" },
] as const;

export const URGENCIES = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "researching", label: "Just researching" },
] as const;

export function labelFor(
  list: readonly { value: string; label: string }[],
  value: string | null | undefined
): string {
  if (!value) return "—";
  return list.find((o) => o.value === value)?.label ?? value;
}
