import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
// IP reputation tracking (simple in-memory)
const ipReputationMap = new Map<string, { failures: number; lastSeen: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  entry.count++;
  return entry.count <= 20;
}

function getIpReputation(ip: string): number {
  const entry = ipReputationMap.get(ip);
  if (!entry) return 1.0;
  // Decay failures over time (1 hour half-life)
  const hoursSince = (Date.now() - entry.lastSeen) / 3600000;
  const effectiveFailures = entry.failures * Math.pow(0.5, hoursSince);
  if (effectiveFailures < 1) return 1.0;
  if (effectiveFailures < 3) return 0.8;
  if (effectiveFailures < 5) return 0.5;
  return 0.2;
}

function recordIpFailure(ip: string) {
  const entry = ipReputationMap.get(ip);
  if (entry) {
    entry.failures++;
    entry.lastSeen = Date.now();
  } else {
    ipReputationMap.set(ip, { failures: 1, lastSeen: Date.now() });
  }
}

function analyzeFingerprintRisk(fp: any): number {
  if (!fp) return 0.5;
  let risk = 0;

  // Headless browser indicators
  if (fp.webgl === '' && fp.plugins === 0) risk += 0.3;
  if (fp.cores === 0 && fp.memory === 0) risk += 0.2;
  if (!fp.cookieEnabled) risk += 0.15;
  if (fp.doNotTrack === '1' && fp.plugins === 0) risk += 0.1;

  // No canvas = suspicious
  if (!fp.canvas || fp.canvas.length < 10) risk += 0.2;

  return Math.min(risk, 1.0);
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
    let tokenData: any;
    try {
      tokenData = JSON.parse(atob(token));
    } catch {
      return new Response(
        JSON.stringify({ success: false, "error-codes": ["invalid-token"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Token expiry (2 minutes)
    const tokenAge = Date.now() - tokenData.timestamp;
    if (tokenAge > 120000) {
      return new Response(
        JSON.stringify({ success: false, "error-codes": ["timeout-or-duplicate"], score: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ success: false, score: 0.1, "error-codes": ["rate-limited"] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // IP reputation
    const ipScore = getIpReputation(ip);

    // Fingerprint risk
    const fpRisk = analyzeFingerprintRisk(tokenData.fp);

    // Validate secret
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

    // Combined AI risk score
    const behaviorScore = tokenData.score || 0;
    const cookieBonus = tokenData.cookie ? 0.05 : -0.1;
    const keyBonus = (tokenData.keys || 0) > 0 ? 0.05 : 0;

    const finalScore = Math.max(0, Math.min(1,
      behaviorScore * 0.5 +          // Behavior analysis: 50%
      ipScore * 0.15 +               // IP reputation: 15%
      (1 - fpRisk) * 0.2 +           // Fingerprint legitimacy: 20%
      cookieBonus +                   // Cookie check: ±5-10%
      keyBonus                        // Keyboard activity: 5%
    ));

    const isHuman = finalScore > 0.5;

    if (!isHuman) recordIpFailure(ip);

    // Log verification
    await supabase.from("verification_logs").insert({
      site_id: site.id,
      is_human: isHuman,
      score: finalScore,
      ip_address: ip,
    });

    return new Response(
      JSON.stringify({
        success: isHuman,
        score: Math.round(finalScore * 100) / 100,
        challenge_ts: new Date(tokenData.timestamp).toISOString(),
        hostname: site.domain,
        checks: {
          behavior: Math.round(behaviorScore * 100) / 100,
          ip_reputation: Math.round(ipScore * 100) / 100,
          fingerprint: Math.round((1 - fpRisk) * 100) / 100,
          cookie: tokenData.cookie || false,
        }
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
