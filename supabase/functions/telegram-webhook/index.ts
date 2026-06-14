import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SITE_URL = "https://nobot-captcha.lovable.app";

async function tg(method: string, body: Record<string, unknown>) {
  return fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function tenDigitId(): string {
  let s = "";
  for (let i = 0; i < 10; i++) s += Math.floor(Math.random() * 10);
  return s;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  try {
    const update = await req.json();
    const msg = update.message ?? update.edited_message;
    if (!msg?.chat?.id) return new Response(JSON.stringify({ ok: true }));

    const chatId = msg.chat.id as number;
    const text = (msg.text || "").trim();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (text.startsWith("/start")) {
      // Find or create telegram_user for this chat
      const { data: existing } = await supabase
        .from("telegram_users")
        .select("*")
        .eq("chat_id", chatId)
        .maybeSingle();

      let loginId = existing?.login_id;
      if (!existing) {
        // generate unique 10-digit id
        for (let i = 0; i < 5; i++) {
          const candidate = tenDigitId();
          const { error } = await supabase.from("telegram_users").insert({
            chat_id: chatId,
            login_id: candidate,
          });
          if (!error) { loginId = candidate; break; }
        }
      }

      const link = `${SITE_URL}/telegram/login?id=${loginId}`;
      await tg("sendMessage", {
        chat_id: chatId,
        text: `Your Telegram ID is ${loginId}.\nPlease log in at ${link}`,
        disable_web_page_preview: true,
      });
    } else {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Send /start to begin.",
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
