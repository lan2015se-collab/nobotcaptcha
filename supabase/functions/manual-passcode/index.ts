// Manual customs clearance — generate / verify one-time passcodes,
// fetch error contact for outage UI, and trigger apology emails.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function rawEmail(to: string, subject: string, body: string) {
  const email = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ].join("\r\n");
  return btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => chars[b % chars.length]).join("");
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Simple per-IP rate limiter (sliding window, in-memory) ──
const RL = new Map<string, number[]>();
function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (RL.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { RL.set(key, arr); return false; }
  arr.push(now); RL.set(key, arr);
  return true;
}
function clientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const ip = clientIP(req);

  try {
    // ── Public: get error_email for fallback UI ──
    if (req.method === "GET" && url.searchParams.get("siteKey")) {
      const siteKey = url.searchParams.get("siteKey")!;
      const { data: site } = await admin.from("sites")
        .select("error_email, domain").eq("site_key", siteKey).maybeSingle();
      return new Response(JSON.stringify({
        error_email: site?.error_email || null,
        domain: site?.domain || null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // ── Public: verify code from end-user ──
    if (action === "verify") {
      const { siteKey, code } = body;
      if (!siteKey || !code) {
        return new Response(JSON.stringify({ ok: false, error: "missing" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: site } = await admin.from("sites").select("id")
        .eq("site_key", siteKey).maybeSingle();
      if (!site) return new Response(JSON.stringify({ ok: false, error: "bad-site" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: pass } = await admin.from("manual_passcodes")
        .select("id, used, expires_at")
        .eq("site_id", site.id)
        .eq("code", String(code).trim().toUpperCase())
        .maybeSingle();
      if (!pass) return new Response(JSON.stringify({ ok: false, error: "invalid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (pass.used) return new Response(JSON.stringify({ ok: false, error: "used" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (new Date(pass.expires_at).getTime() < Date.now())
        return new Response(JSON.stringify({ ok: false, error: "expired" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await admin.from("manual_passcodes").update({ used: true, used_at: new Date().toISOString() }).eq("id", pass.id);
      const token = "mcc." + Date.now() + "." + crypto.randomUUID();
      return new Response(JSON.stringify({ ok: true, token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Public: trigger outage apology email to site owner ──
    if (action === "trigger-outage") {
      const { siteKey } = body;
      const { data: site } = await admin.from("sites")
        .select("id, user_id, domain").eq("site_key", siteKey).maybeSingle();
      if (!site) return new Response(JSON.stringify({ ok: false }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // throttle: skip if we already triggered in last 10 minutes for this site
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count } = await admin.from("manual_passcodes")
        .select("id", { count: "exact", head: true })
        .eq("site_id", site.id).gte("created_at", since);
      // (we reuse the table's recent activity as a soft throttle; if no recent passcode, send)

      const { data: userResult } = await admin.auth.admin.getUserById(site.user_id);
      const userEmail = userResult?.user?.email;
      if (userEmail && GOOGLE_MAIL_API_KEY && LOVABLE_API_KEY && (count ?? 0) === 0) {
        const subject = "很抱歉   NobotCAPTCHA 出了點問題...";
        const text = [
          "我們的服務暫時遇到錯誤等 Bug，我們已向你的用戶通知並給予你的電子郵件，用來獲取通關碼。",
          "",
          "NobotCAPTCHA 致歉",
          "",
          "現可透過 https://nobot-captcha.lovable.app/change-log 查看狀態",
          "",
          "請進入",
          "",
          "https://nobot-captcha.lovable.app/manual-customs-clearance",
          "",
          "生成通關碼，謝謝",
          "",
          `網站：${site.domain}`,
          `時間：${new Date().toISOString()}`,
        ].join("\n");
        await fetch(`${GATEWAY_URL}/google_mail/gmail/v1/users/me/messages/send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: rawEmail(userEmail, subject, text) }),
        });
      }
      return new Response(JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Authed: generate one-time passcode ──
    if (action === "generate") {
      const authHeader = req.headers.get("Authorization") || "";
      const jwt = authHeader.replace("Bearer ", "");
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return new Response(JSON.stringify({ ok: false, error: "unauth" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { siteId } = body;
      const { data: site } = await admin.from("sites")
        .select("id, user_id").eq("id", siteId).maybeSingle();
      if (!site || site.user_id !== user.id) {
        return new Response(JSON.stringify({ ok: false, error: "forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const code = randomCode(8);
      const { error } = await admin.from("manual_passcodes").insert({
        site_id: site.id, user_id: user.id, code,
      });
      if (error) return new Response(JSON.stringify({ ok: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(JSON.stringify({ ok: true, code, expires_in_minutes: 30 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: false, error: "bad-action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
