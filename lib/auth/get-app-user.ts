import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types/database";

export async function getAppUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const authId = claimsData?.claims?.sub;

  if (!authId || typeof authId !== "string") {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as AppUser;
}
