import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action"); // create | update | delete | reset-password

    const body = await req.json();

    if (action === "create") {
      const { name, username, password, email, phone, role_id, notes, created_by } = body;

      if (!name || !username || !password) {
        return json({ error: "Name, username, and password are required" }, 400);
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username as string)) {
        return json({ error: "Username can only contain letters, numbers, and underscores" }, 400);
      }
      if ((password as string).length < 6) {
        return json({ error: "Password must be at least 6 characters" }, 400);
      }

      const { data: hashData, error: hashError } = await supabaseAdmin.rpc("hash_password", { p_password: password });
      if (hashError) return json({ error: "Failed to hash password" }, 500);
      const password_hash = hashData;

      const { data, error } = await supabaseAdmin
        .from("users")
        .insert({
          name,
          username: username.toLowerCase().trim(),
          password_hash,
          email: email ?? "",
          phone: phone ?? "",
          role_id: role_id || null,
          notes: notes ?? "",
          created_by: created_by ?? null,
          is_active: true,
        })
        .select("id, name, username, email, phone, role_id, is_active, avatar_url, last_login_at, created_at, updated_at, deleted_at, notes, roles(id, name, description, permissions)")
        .maybeSingle();

      if (error) {
        if (error.code === "23505") return json({ error: "Username already exists" }, 409);
        return json({ error: error.message }, 500);
      }
      return json({ user: data }, 200);
    }

    if (action === "update") {
      const { id, name, username, email, phone, role_id, is_active, notes, avatar_url, updated_by } = body;
      if (!id) return json({ error: "User ID is required" }, 400);

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        updated_by: updated_by ?? null,
      };
      if (name !== undefined) updates.name = name;
      if (username !== undefined) updates.username = username.toLowerCase().trim();
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      if (role_id !== undefined) updates.role_id = role_id || null;
      if (is_active !== undefined) updates.is_active = is_active;
      if (notes !== undefined) updates.notes = notes;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;

      const { data, error } = await supabaseAdmin
        .from("users")
        .update(updates)
        .eq("id", id)
        .select("id, name, username, email, phone, role_id, is_active, avatar_url, last_login_at, created_at, updated_at, deleted_at, notes, roles(id, name, description, permissions)")
        .maybeSingle();

      if (error) {
        if (error.code === "23505") return json({ error: "Username already exists" }, 409);
        return json({ error: error.message }, 500);
      }
      return json({ user: data }, 200);
    }

    if (action === "reset-password") {
      const { id, password, updated_by } = body;
      if (!id || !password) return json({ error: "User ID and new password are required" }, 400);
      if (password.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);

      const { data: hashData2, error: hashError2 } = await supabaseAdmin.rpc("hash_password", { p_password: password });
      if (hashError2) return json({ error: "Failed to hash password" }, 500);
      const { error } = await supabaseAdmin
        .from("users")
        .update({ password_hash: hashData2, updated_at: new Date().toISOString(), updated_by: updated_by ?? null })
        .eq("id", id);

      if (error) return json({ error: error.message }, 500);
      return json({ success: true }, 200);
    }

    if (action === "delete") {
      // Soft delete
      const { id, deleted_by } = body;
      if (!id) return json({ error: "User ID is required" }, 400);

      const { error } = await supabaseAdmin
        .from("users")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deleted_by ?? null,
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) return json({ error: error.message }, 500);
      return json({ success: true }, 200);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
