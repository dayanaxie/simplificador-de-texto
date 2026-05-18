import { supabase } from "./supabaseClient";

export async function getUsers() {
  return await supabase.from("users").select("*");
}

export async function createUser(user: {
  name: string;
  email: string;
  password_hash: string;
}) {
  return await supabase.from("users").insert(user);
}
