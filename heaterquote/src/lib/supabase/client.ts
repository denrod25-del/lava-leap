"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

// Browser Supabase client (anon key). Used by the estimator form to upload
// photos to Storage. Lead rows are written via the server API route.
export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in."
    );
  }

  browserClient = createClient(url, anonKey);
  return browserClient;
}

export const PHOTO_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PHOTO_BUCKET || "lead-photos";
