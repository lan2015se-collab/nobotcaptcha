import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, display_name, rating } = await req.json();

    if (!content || content.length < 15) {
      return new Response(JSON.stringify({ approved: false, reason: "內容至少需要15個字" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ approved: false, reason: "評分需在1-5之間" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are a content moderator for a tech product review platform. Check if the review contains inappropriate content such as profanity, sexual content, hate speech, discrimination, threats, or spam. Only flag truly inappropriate content - normal product feedback (positive or negative) should be approved.",
          },
          {
            role: "user",
            content: `Review by "${display_name}": "${content}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "moderate_content",
              description: "Return moderation result",
              parameters: {
                type: "object",
                properties: {
                  approved: { type: "boolean", description: "true if content is appropriate, false if inappropriate" },
                  reason: { type: "string", description: "Brief reason in Chinese if rejected, or '審核通過' if approved" },
                },
                required: ["approved", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "moderate_content" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ approved: false, reason: "系統繁忙，請稍後再試" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ approved: false, reason: "服務額度不足" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: approve if AI doesn't return structured output
    return new Response(JSON.stringify({ approved: true, reason: "審核通過" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Moderation error:", e);
    return new Response(
      JSON.stringify({ approved: false, reason: "審核系統錯誤，請稍後再試" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
