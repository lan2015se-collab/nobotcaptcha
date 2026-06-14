// Proof-of-Work challenge + verify (stateless, HMAC-signed)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "fallback-pow-secret";
const TTL_MS = 120_000;

async function hmac(msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function difficultyFor(level?: string): number {
  switch (level) {
    case "easy": return 3;
    case "hard": return 4;
    case "extreme": return 5;
    default: return 3;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

  // Issue challenge
  if (req.method === "GET") {
    const level = url.searchParams.get("level") || "medium";
    const difficulty = difficultyFor(level);
    const salt = crypto.randomUUID().replace(/-/g, "");
    const ts = Date.now();
    const sig = await hmac(`${salt}.${ts}.${difficulty}`);
    return new Response(JSON.stringify({ salt, ts, difficulty, sig }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify solution
  if (req.method === "POST") {
    try {
      const { salt, ts, difficulty, sig, nonce } = await req.json();
      if (!salt || !ts || !difficulty || !sig || nonce === undefined) {
        return new Response(JSON.stringify({ ok: false, error: "missing-fields" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Expiry
      if (Date.now() - ts > TTL_MS) {
        return new Response(JSON.stringify({ ok: false, error: "expired" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // HMAC check
      const expected = await hmac(`${salt}.${ts}.${difficulty}`);
      if (expected !== sig) {
        return new Response(JSON.stringify({ ok: false, error: "bad-sig" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // PoW check
      const h = await sha256Hex(salt + nonce);
      const prefix = "0".repeat(difficulty);
      if (!h.startsWith(prefix)) {
        return new Response(JSON.stringify({ ok: false, error: "bad-pow" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Issue verification token
      const tokenPayload = { t: Date.now(), salt };
      const token = btoa(JSON.stringify(tokenPayload)) + "." + (await hmac(JSON.stringify(tokenPayload)));
      return new Response(JSON.stringify({ ok: true, token }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
});
