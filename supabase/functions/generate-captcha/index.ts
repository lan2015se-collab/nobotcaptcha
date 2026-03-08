import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const imageCategories = [
  { name: "cat", label: "貓", decoy: "dog" },
  { name: "car", label: "車", decoy: "bicycle" },
  { name: "flower", label: "花", decoy: "tree" },
  { name: "star", label: "星星", decoy: "moon" },
  { name: "fish", label: "魚", decoy: "bird" },
  { name: "apple", label: "蘋果", decoy: "banana" },
  { name: "house", label: "房子", decoy: "tent" },
  { name: "sun", label: "太陽", decoy: "cloud" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (type === "image") {
      const cat = imageCategories[Math.floor(Math.random() * imageCategories.length)];
      const targetCount = 2 + Math.floor(Math.random() * 2); // 2-3
      const positions = Array.from({ length: 9 }, (_, i) => i);
      const shuffled = positions.sort(() => Math.random() - 0.5);
      const targets = shuffled.slice(0, targetCount);
      const targetSet = new Set(targets);

      const cellDescriptions = Array.from({ length: 9 }, (_, i) => {
        const row = Math.floor(i / 3) + 1;
        const col = (i % 3) + 1;
        const subject = targetSet.has(i) ? cat.name : cat.decoy;
        return `Row ${row}, Column ${col}: a cute cartoon ${subject}`;
      }).join(". ");

      const prompt = `Create a 3x3 grid image (300x300 pixels) on a dark navy background (#0f172a). Each cell is 100x100 pixels separated by thin gray (#334155) lines. ${cellDescriptions}. Simple flat cartoon style, colorful, each icon clearly centered in its cell. No text or labels.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI image error:", response.status, errText);
        return new Response(JSON.stringify({ error: "Image generation failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      return new Response(
        JSON.stringify({
          type: "image",
          image: imageUrl,
          label: cat.label,
          targets: targets,
          gridSize: 3,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (type === "text") {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let text = "";
      const len = 5 + Math.floor(Math.random() * 2);
      for (let i = 0; i < len; i++) {
        text += chars[Math.floor(Math.random() * chars.length)];
      }

      const prompt = `Generate a CAPTCHA image (220x70 pixels). Dark navy background (#0f172a). Display the text "${text}" with each character distorted: random rotation (-30 to 30 degrees), random scaling, different fonts and colors (blue, purple, cyan, green). Add noise: random colored lines crossing the image, small dots scattered everywhere, and wavy overlay lines. The text should be challenging for OCR but readable by humans. No other text or labels.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI text captcha error:", response.status, errText);
        return new Response(JSON.stringify({ error: "Text captcha generation failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      return new Response(
        JSON.stringify({
          type: "text",
          image: imageUrl,
          answer: text,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid type. Use 'image' or 'text'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-captcha error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
