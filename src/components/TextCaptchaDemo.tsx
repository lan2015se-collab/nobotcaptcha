import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CaptchaState = "loading" | "ready" | "verifying" | "verified" | "failed" | "locked";

interface TextCaptchaDemoProps {
  demo?: boolean;
  difficulty?: "easy" | "medium" | "hard" | "extreme";
}

export function TextCaptchaDemo({ difficulty = "medium" }: TextCaptchaDemoProps) {
  const [state, setState] = useState<CaptchaState>("loading");
  const [image, setImage] = useState("");
  const [answer, setAnswer] = useState("");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [failCount, setFailCount] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);

  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const id = setInterval(() => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockRemaining(0);
        setFailCount(0);
        loadChallenge();
        clearInterval(id);
      } else setLockRemaining(remaining);
    }, 500);
    return () => clearInterval(id);
  }, [lockUntil]);

  const loadChallenge = useCallback(async () => {
    setState("loading");
    setInput("");
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-captcha", {
        body: { type: "text", difficulty },
      });
      if (fnError || !data?.image) {
        setError("無法載入驗證");
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
  }, [difficulty]);

  useEffect(() => { loadChallenge(); }, [loadChallenge]);

  const verify = () => {
    if (state !== "ready") return;
    setState("verifying");
    setTimeout(() => {
      if (input.trim().toUpperCase() === answer.toUpperCase()) {
        setState("verified");
        setFailCount(0);
      } else {
        const newFails = failCount + 1;
        setFailCount(newFails);
        if (newFails >= 5) {
          setLockUntil(Date.now() + 60000);
          setLockRemaining(60);
          setState("locked");
        } else {
          setState("failed");
          setTimeout(() => loadChallenge(), 1200);
        }
      }
    }, 500);
  };

  if (state === "locked") {
    return (
      <div className="w-[320px] rounded-md border border-red-200 bg-white shadow-sm select-none"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="p-6 flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-800">您錯誤了太多次</p>
          <p className="text-xs text-gray-500">請 {lockRemaining} 秒後再試</p>
        </div>
        <div className="border-t border-gray-100 py-1.5 text-center">
          <span className="text-[10px] tracking-wider text-gray-400">Powered By NobotCAPTCHA</span>
        </div>
      </div>
    );
  }

  if (state === "verified") {
    return (
      <div className="w-[320px] rounded-md border border-gray-200 bg-white shadow-sm select-none px-3 py-3"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="flex items-center">
          <div className="w-7 h-7 rounded border-2 border-green-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4,10 8,14 16,6" />
            </svg>
          </div>
          <span className="ml-3 text-sm text-green-600">驗證成功</span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 text-center">
          <span className="text-[10px] tracking-wider text-gray-400">Powered By NobotCAPTCHA</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[320px] rounded-md border border-gray-200 bg-white shadow-sm select-none"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="px-4 py-2.5 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-800">請輸入圖片中的文字（不分大小寫）</div>
      </div>

      <div className="p-3 flex flex-col items-center gap-3">
        {state === "loading" ? (
          <div className="w-[260px] h-[90px] rounded bg-gray-50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="w-[260px] h-[90px] rounded bg-gray-50 flex flex-col items-center justify-center gap-1">
            <p className="text-xs text-gray-500">{error}</p>
            <button onClick={loadChallenge} className="text-xs text-indigo-600 hover:underline">重試</button>
          </div>
        ) : (
          <img src={image} alt="captcha" className="w-[260px] h-[90px] rounded border border-gray-200 bg-white" />
        )}

        <div className="flex items-center gap-2 w-full">
          <button onClick={loadChallenge} className="p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors shrink-0" aria-label="換一張">
            <RefreshCw className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verify()}
            placeholder="輸入上方文字"
            autoComplete="off"
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono tracking-widest text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="px-3 py-2 flex items-center justify-between border-t border-gray-100">
        <span className="text-[10px] tracking-wider text-gray-400">Powered By NobotCAPTCHA</span>
        <button
          onClick={verify}
          disabled={state !== "ready" || !input.trim()}
          className="px-5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "verifying" ? "驗證中..." : state === "failed" ? "重試中..." : "驗證"}
        </button>
      </div>
    </div>
  );
}
