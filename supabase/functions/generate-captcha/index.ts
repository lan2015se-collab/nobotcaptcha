import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Cfg {
  length: [number, number];
  lines: number;
  dots: number;
  rotate: number; // max degrees
  wave: number;   // amplitude
}

const cfgs: Record<string, Cfg> = {
  easy:    { length: [4, 4], lines: 2,  dots: 30,  rotate: 10, wave: 2 },
  medium:  { length: [5, 5], lines: 4,  dots: 60,  rotate: 20, wave: 4 },
  hard:    { length: [6, 6], lines: 6,  dots: 120, rotate: 30, wave: 6 },
  extreme: { length: [7, 7], lines: 9,  dots: 200, rotate: 40, wave: 9 },
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randi = (min: number, max: number) => Math.floor(rand(min, max + 1));

function colorDark() {
  // dark colors that read well on white
  const palette = ["#1f2937", "#111827", "#0f172a", "#1e293b", "#312e81", "#3730a3", "#1e3a8a", "#7c2d12"];
  return palette[randi(0, palette.length - 1)];
}
function colorLine() {
  const palette = ["#94a3b8", "#cbd5e1", "#a5b4fc", "#fca5a5", "#fcd34d", "#86efac"];
  return palette[randi(0, palette.length - 1)];
}

// dchest/captcha-style SVG: white background, distorted characters,
// wave displacement, crossing lines, and speckle noise.
function buildSvg(text: string, cfg: Cfg): string {
  const W = 260, H = 90;
  const n = text.length;
  const slot = (W - 30) / n;
  const baseY = H / 2 + 12;

  const chars = text.split("").map((ch, i) => {
    const cx = 18 + slot * i + slot / 2 + rand(-4, 4);
    const cy = baseY + rand(-cfg.wave, cfg.wave);
    const rot = rand(-cfg.rotate, cfg.rotate);
    const size = randi(32, 42);
    const color = colorDark();
    return `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${size}" fill="${color}" text-anchor="middle" transform="rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})">${ch}</text>`;
  }).join("");

  // wavy curves crossing the image
  const curves = Array.from({ length: cfg.lines }, () => {
    const y1 = rand(10, H - 10);
    const y2 = rand(10, H - 10);
    const cy1 = rand(0, H);
    const cy2 = rand(0, H);
    return `<path d="M 0 ${y1.toFixed(1)} C ${(W / 3).toFixed(1)} ${cy1.toFixed(1)}, ${(2 * W / 3).toFixed(1)} ${cy2.toFixed(1)}, ${W} ${y2.toFixed(1)}" stroke="${colorLine()}" stroke-width="${rand(1, 2.2).toFixed(2)}" fill="none" opacity="0.7"/>`;
  }).join("");

  // speckle dots
  const dots = Array.from({ length: cfg.dots }, () => {
    return `<circle cx="${rand(0, W).toFixed(1)}" cy="${rand(0, H).toFixed(1)}" r="${rand(0.5, 1.4).toFixed(2)}" fill="${colorLine()}" opacity="${rand(0.3, 0.8).toFixed(2)}"/>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#ffffff"/>${dots}${curves}${chars}</svg>`;
  return svg;
}

function toDataUrl(svg: string): string {
  // utf8 -> base64
  const bytes = new TextEncoder().encode(svg);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return "data:image/svg+xml;base64," + btoa(bin);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type = "text", difficulty = "medium" } = await req.json().catch(() => ({}));
    const cfg = cfgs[difficulty] || cfgs.medium;
    const [minL, maxL] = cfg.length;
    const len = randi(minL, maxL);

    // image mode: digits only (easier to recognize, dchest-style)
    // text mode: alphanumeric without ambiguous chars
    const pool = type === "image"
      ? "0123456789"
      : "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let answer = "";
    for (let i = 0; i < len; i++) answer += pool[randi(0, pool.length - 1)];

    const svg = buildSvg(answer, cfg);
    const image = toDataUrl(svg);

    return new Response(
      JSON.stringify({ type, image, answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-captcha error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
