import type { AddOnKey } from "./estimate";

// Row shape stored in the Supabase `leads` table.
export interface Lead {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  zip: string;
  current_system: "tank" | "tankless";
  system_type: "tank" | "tankless";
  tankless_type: "replacement" | "conversion" | null;
  fuel_type: "gas" | "electric";
  gallon_size: string;
  location: string;
  current_issue: string;
  urgency: string;
  add_ons: AddOnKey[];
  estimate_low: number;
  estimate_high: number;
  photo_urls: string[];
  status: string;
}

// Payload accepted by POST /api/leads.
export interface LeadSubmission {
  name: string;
  phone: string;
  email: string;
  zip: string;
  current_system: "tank" | "tankless";
  system_type: "tank" | "tankless";
  fuel_type: "gas" | "electric";
  gallon_size: string;
  location: string;
  current_issue: string;
  urgency: string;
  add_ons: AddOnKey[];
  photo_urls: string[];
}
