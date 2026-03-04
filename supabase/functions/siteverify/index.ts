import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiting (per edge function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 }); // 1 minute window
    return true;
  }

  entry.count++;
  if (entry.count > 20) {
    // More than 20 requests per minute from same IP
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secret, token } = await req.json();

    if (!secret || !token) {
      return new Response(
        JSON.stringify({ success: false, "error-codes": ["missing-input"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode token
    let tokenData: { siteKey: string; timestamp: number; score: number; movements: number };
    try {
      tokenData = JSON.parse(atob(token));
    } catch {
      return new Response(
        JSON.stringify({ success: false, "error-codes": ["invalid-token"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check token expiry (2 minutes)
    const tokenAge = Date.now() - tokenData.timestamp;
    if (tokenAge > 120000) {
      return new Response(
        JSON.stringify({ success: false, "error-codes": ["timeout-or-duplicate"], score: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ success: false, score: 0.1, "error-codes": ["rate-limited"] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate secret against sites table
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, domain")
      .eq("secret_key", secret)
      .single();

    if (siteError || !site) {
      return new Response(
        JSON.stringify({ success: false, "error-codes": ["invalid-secret"] }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the verification
    await supabase.from("verification_logs").insert({
      site_id: site.id,
      is_human: tokenData.score > 0.5,
      score: tokenData.score,
      ip_address: ip,
    });

    return new Response(
      JSON.stringify({
        success: tokenData.score > 0.5,
        score: tokenData.score,
        challenge_ts: new Date(tokenData.timestamp).toISOString(),
        hostname: site.domain,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, "error-codes": ["internal-error"] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
