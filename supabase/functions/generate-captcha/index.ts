import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const imageCategories = [
  { name: "cat", label: "貓", decoys: ["dog", "rabbit", "hamster"] },
  { name: "car", label: "車", decoys: ["bicycle", "motorcycle", "scooter"] },
  { name: "flower", label: "花", decoys: ["tree", "mushroom", "cactus"] },
  { name: "star", label: "星星", decoys: ["moon", "cloud", "planet"] },
  { name: "fish", label: "魚", decoys: ["bird", "butterfly", "bee"] },
  { name: "apple", label: "蘋果", decoys: ["banana", "grape", "pear"] },
  { name: "house", label: "房子", decoys: ["tent", "castle", "barn"] },
  { name: "sun", label: "太陽", decoys: ["cloud", "rain", "lightning"] },
];

interface DifficultyConfig {
  // Image captcha
  gridSize: number;
  targetCount: [number, number]; // min, max
  decoyVariety: number; // how many different decoy types
  imageStyle: string;
  // Text captcha
  textLength: [number, number];
  distortionLevel: string;
  noiseLevel: string;
}

const difficultyConfigs: Record<string, DifficultyConfig> = {
  easy: {
    gridSize: 3,
    targetCount: [2, 3],
    decoyVariety: 1,
    imageStyle: "Simple flat cartoon style, colorful, very clear and distinct, each icon large and centered in its cell.",
    textLength: [4, 4],
    distortionLevel: "very slight rotation (-10 to 10 degrees), uniform size",
    noiseLevel: "a few faint dots scattered, no crossing lines",
  },
  medium: {
    gridSize: 3,
    targetCount: [2, 3],
    decoyVariety: 1,
    imageStyle: "Simple flat cartoon style, colorful, each icon clearly centered in its cell.",
    textLength: [5, 6],
    distortionLevel: "random rotation (-25 to 25 degrees), random scaling",
    noiseLevel: "random colored lines crossing the image, small dots scattered everywhere",
  },
  hard: {
    gridSize: 4,
    targetCount: [3, 5],
    decoyVariety: 2,
    imageStyle: "Detailed cartoon style with similar colors between targets and decoys, icons slightly overlapping cell borders, subtle differences.",
    textLength: [6, 7],
    distortionLevel: "heavy rotation (-35 to 35 degrees), random scaling, characters overlapping each other slightly",
    noiseLevel: "many colored lines crossing the image, heavy dots, wavy overlay lines, grid patterns in background",
  },
  extreme: {
    gridSize: 4,
    targetCount: [4, 6],
    decoyVariety: 3,
    imageStyle: "Very detailed realistic style with visually similar objects, subtle differences between targets and decoys, muted similar color palette, some visual noise in background.",
    textLength: [7, 8],
    distortionLevel: "extreme rotation (-45 to 45 degrees), heavy scaling variation, characters heavily overlapping, some characters mirrored or warped",
    noiseLevel: "dense colored lines everywhere, heavy dots and speckles, multiple wavy overlay lines, gradient noise, crosshatch patterns, some characters partially obscured",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, difficulty = "medium" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing configuration");

    const config = difficultyConfigs[difficulty] || difficultyConfigs.medium;

    if (type === "image") {
      const cat = imageCategories[Math.floor(Math.random() * imageCategories.length)];
      const totalCells = config.gridSize * config.gridSize;
      const [minT, maxT] = config.targetCount;
      const targetCount = minT + Math.floor(Math.random() * (maxT - minT + 1));
      const positions = Array.from({ length: totalCells }, (_, i) => i);
      const shuffled = positions.sort(() => Math.random() - 0.5);
      const targets = shuffled.slice(0, targetCount);
      const targetSet = new Set(targets);

      // Pick decoys based on difficulty
      const availableDecoys = cat.decoys.slice(0, config.decoyVariety);

      const cellSize = Math.floor(300 / config.gridSize);
      const cellDescriptions = Array.from({ length: totalCells }, (_, i) => {
        const row = Math.floor(i / config.gridSize) + 1;
        const col = (i % config.gridSize) + 1;
        if (targetSet.has(i)) {
          return `Row ${row}, Column ${col}: a cute cartoon ${cat.name}`;
        } else {
          const decoy = availableDecoys[Math.floor(Math.random() * availableDecoys.length)];
          return `Row ${row}, Column ${col}: a cute cartoon ${decoy}`;
        }
      }).join(". ");

      const prompt = `Create a ${config.gridSize}x${config.gridSize} grid image (300x300 pixels) on a dark navy background (#0f172a). Each cell is ${cellSize}x${cellSize} pixels separated by thin gray (#334155) lines. ${cellDescriptions}. ${config.imageStyle} No text or labels.`;

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
        console.error("Image generation error:", response.status, errText);
        return new Response(JSON.stringify({ error: "Challenge generation failed" }), {
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
          gridSize: config.gridSize,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (type === "text") {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const [minLen, maxLen] = config.textLength;
      const len = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
      let text = "";
      for (let i = 0; i < len; i++) {
        text += chars[Math.floor(Math.random() * chars.length)];
      }

      const prompt = `Generate a CAPTCHA image (220x70 pixels). Dark navy background (#0f172a). Display the text "${text}" with each character distorted: ${config.distortionLevel}, different fonts and colors (blue, purple, cyan, green). Add noise: ${config.noiseLevel}. The text should be challenging for OCR but readable by humans. No other text or labels.`;

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
        console.error("Text challenge error:", response.status, errText);
        return new Response(JSON.stringify({ error: "Challenge generation failed" }), {
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
