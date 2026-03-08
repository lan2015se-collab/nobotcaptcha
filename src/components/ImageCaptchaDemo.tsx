import { useState, useEffect, useRef, useCallback } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CaptchaState = "loading" | "ready" | "verifying" | "verified" | "failed";

interface ImageCaptchaDemoProps {
  demo?: boolean;
}

export function ImageCaptchaDemo({ demo = true }: ImageCaptchaDemoProps) {
  const [state, setState] = useState<CaptchaState>("loading");
  const [image, setImage] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [targets, setTargets] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const loadChallenge = useCallback(async () => {
    setState("loading");
    setSelected(new Set());
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-captcha", {
        body: { type: "image" },
      });
      if (fnError || !data?.image) {
        setError("無法載入圖片驗證");
        setState("failed");
        return;
      }
      setImage(data.image);
      setLabel(data.label);
      setTargets(data.targets);
      setState("ready");
    } catch {
      setError("載入失敗");
      setState("failed");
    }
  }, []);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const toggleCell = (idx: number) => {
    if (state !== "ready") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const verify = () => {
    if (state !== "ready") return;
    setState("verifying");

    setTimeout(() => {
      const targetSet = new Set(targets);
      let correct = true;
      for (let i = 0; i < 9; i++) {
        if (targetSet.has(i) !== selected.has(i)) {
          correct = false;
          break;
        }
      }

      if (correct || demo) {
        setState("verified");
      } else {
        setState("failed");
        setTimeout(() => loadChallenge(), 1500);
      }
    }, 800);
  };

  if (state === "verified") {
    return (
      <div className="w-[300px] h-[74px] rounded-md border border-border bg-card flex items-center px-3 select-none shadow-lg"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="w-7 h-7 rounded border-2 border-nobot-green flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-nobot-green" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4,10 8,14 16,6" />
          </svg>
        </div>
        <span className="ml-3 text-sm text-nobot-green select-none">驗證成功</span>
        <div className="ml-auto flex flex-col items-center gap-0.5">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">Nobot</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[320px] rounded-lg border border-border bg-card overflow-hidden shadow-lg select-none"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="px-4 py-3 bg-primary text-primary-foreground flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">選出所有的「{label || "..."}」</div>
          <div className="text-xs opacity-80">請點選正確的圖案</div>
        </div>
        <Shield className="w-5 h-5" />
      </div>

      {/* Grid */}
      {state === "loading" ? (
        <div className="aspect-square flex items-center justify-center bg-secondary/30">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="aspect-square flex flex-col items-center justify-center bg-secondary/30 gap-2">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={loadChallenge} className="text-xs text-primary hover:underline">重試</button>
        </div>
      ) : (
        <div className="relative">
          <img src={image} alt="captcha grid" className="w-full aspect-square object-cover" />
          {/* Clickable overlay grid */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }, (_, i) => (
              <button
                key={i}
                onClick={() => toggleCell(i)}
                className={`border transition-all ${
                  selected.has(i)
                    ? "border-primary bg-primary/30"
                    : "border-transparent hover:bg-primary/10"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between border-t border-border">
        <div className="flex items-center gap-2">
          <button onClick={loadChallenge} className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nobot</span>
        </div>
        <button
          onClick={verify}
          disabled={state !== "ready" || selected.size === 0}
          className="px-5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "verifying" ? "驗證中..." : state === "failed" ? "重試中..." : "驗證"}
        </button>
      </div>
    </div>
  );
}
