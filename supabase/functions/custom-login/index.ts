import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return json({ error: "Username and password are required" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify password via Postgres crypt() — avoids bcrypt npm dependency
    const { data: rows, error: rpcError } = await supabaseAdmin
      .rpc("verify_user_password", { p_username: username, p_password: password });

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return json({ error: "Internal server error" }, 500);
    }

    if (!rows || rows.length === 0) {
      return json({ error: "Invalid username or password" }, 401);
    }

    const userRow = rows[0];

    // Fetch role data separately
    const { data: roleData } = await supabaseAdmin
      .from("roles")
      .select("id, name, description, permissions")
      .eq("id", userRow.role_id)
      .maybeSingle();

    // Update last_login_at via RPC
    await supabaseAdmin.rpc("update_last_login", { p_user_id: userRow.id });

    return json({
      user: {
        ...userRow,
        roles: roleData ?? null,
      }
    }, 200);

  } catch (err) {
    console.error("Login error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
