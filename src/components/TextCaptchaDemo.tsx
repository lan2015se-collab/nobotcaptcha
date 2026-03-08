import { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CaptchaState = "loading" | "ready" | "verifying" | "verified" | "failed";

interface TextCaptchaDemoProps {
  demo?: boolean;
}

export function TextCaptchaDemo({ demo = true }: TextCaptchaDemoProps) {
  const [state, setState] = useState<CaptchaState>("loading");
  const [image, setImage] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const loadChallenge = useCallback(async () => {
    setState("loading");
    setInput("");
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-captcha", {
        body: { type: "text" },
      });
      if (fnError || !data?.image) {
        setError("無法載入文字驗證");
        setState("failed");
        return;
      }
      setImage(data.image);
      setAnswer(data.answer);
      setState("ready");
    } catch {
      setError("載入失敗");
      setState("failed");
    }
  }, []);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const verify = () => {
    if (state !== "ready") return;
    setState("verifying");

    setTimeout(() => {
      if (input.toUpperCase() === answer.toUpperCase() || demo) {
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
      <div className="px-4 py-2.5 bg-primary text-primary-foreground flex items-center justify-between">
        <div className="text-sm font-semibold">請輸入圖片中的文字</div>
        <Shield className="w-5 h-5" />
      </div>

      {/* Image */}
      <div className="p-3 flex flex-col items-center gap-3">
        {state === "loading" ? (
          <div className="w-[220px] h-[70px] rounded-md bg-secondary/30 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="w-[220px] h-[70px] rounded-md bg-secondary/30 flex flex-col items-center justify-center gap-1">
            <p className="text-xs text-muted-foreground">{error}</p>
            <button onClick={loadChallenge} className="text-xs text-primary hover:underline">重試</button>
          </div>
        ) : (
          <img src={image} alt="captcha text" className="w-[220px] h-[70px] rounded-md border border-border object-cover" />
        )}

        {/* Input row */}
        <div className="flex items-center gap-2 w-full">
          <button onClick={loadChallenge} className="p-2 rounded-md bg-secondary/50 hover:bg-secondary text-muted-foreground transition-colors shrink-0">
            <RefreshCw className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verify()}
            placeholder="請輸入上方文字"
            autoComplete="off"
            className="flex-1 px-3 py-2 bg-secondary/30 border border-border rounded-md text-sm font-mono tracking-widest text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between border-t border-border">
        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nobot</span>
        <button
          onClick={verify}
          disabled={state !== "ready" || !input.trim()}
          className="px-5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "verifying" ? "驗證中..." : state === "failed" ? "重試中..." : "驗證"}
        </button>
      </div>
    </div>
  );
}
