import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function rawEmail(to: string, subject: string, body: string) {
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ].join("\r\n");
  return btoa(email).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { siteKey, domain } = await req.json();
    if (!siteKey) {
      return new Response(JSON.stringify({ ok: false, error: "missing siteKey" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: site } = await supabase
      .from("sites")
      .select("id, domain, user_id")
      .eq("site_key", siteKey)
      .maybeSingle();
    if (!site) {
      return new Response(JSON.stringify({ ok: false, error: "site not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const failedSite = domain || site.domain;
    const now = new Date().toISOString();

    // Get user email
    const { data: userResult } = await supabase.auth.admin.getUserById(site.user_id);
    const userEmail = userResult?.user?.email;

    // Gmail
    if (userEmail && GOOGLE_MAIL_API_KEY && LOVABLE_API_KEY) {
      const subject = "Failed to verify";
      const body = [
        "Hello",
        "",
        "We are NobotCAPTCHA",
        "",
        `Your website ${failedSite} maybe robot activity.`,
        "",
        "That's all we know.",
        "",
        "And",
        "",
        "Thank u dor using our captcha service!",
        "",
        now,
      ].join("\n");
      await fetch(`${GATEWAY_URL}/google_mail/gmail/v1/users/me/messages/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawEmail(userEmail, subject, body) }),
      });
    }

    // Telegram (all chats linked to this user)
    const { data: tgUsers } = await supabase
      .from("telegram_users")
      .select("chat_id")
      .eq("user_id", site.user_id)
      .eq("linked", true);

    const tgMsg = `Your website ${failedSite} maybe robot activity.\nThat's all we know.`;
    for (const u of tgUsers || []) {
      await fetch(`${GATEWAY_URL}/telegram/sendMessage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chat_id: u.chat_id, text: tgMsg }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
