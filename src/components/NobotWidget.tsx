import { useState, useEffect, useRef, useCallback } from "react";

type WidgetState = "idle" | "verifying" | "verified" | "failed" | "locked";

interface NobotWidgetProps {
  siteKey?: string;
  onVerify?: (token: string) => void;
  demo?: boolean;
  /** PoW difficulty: number of leading hex zeros required */
  difficulty?: number;
  /** PoW: number of challenges to solve */
  challenges?: number;
}

// SHA-256 -> hex
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Cap-style Proof-of-Work CAPTCHA.
 * - Issues N random salts client-side (demo) or could be fetched from server
 * - For each salt, find a nonce so sha256(salt+nonce) starts with D leading "0"s
 * - Verification = all challenges solved within reasonable time
 */
async function solveChallenge(salt: string, difficulty: number): Promise<number> {
  const prefix = "0".repeat(difficulty);
  let nonce = 0;
  // hard cap to avoid runaway on slow devices
  const MAX = 1_500_000;
  while (nonce < MAX) {
    const h = await sha256Hex(salt + nonce);
    if (h.startsWith(prefix)) return nonce;
    nonce++;
  }
  throw new Error("PoW failed");
}

export function NobotWidget({
  siteKey = "demo",
  onVerify,
  difficulty = 4,
  challenges = 3,
}: NobotWidgetProps) {
  const [state, setState] = useState<WidgetState>("idle");
  const [progress, setProgress] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  const lockUntilRef = useRef(0);

  useEffect(() => {
    if (lockUntilRef.current <= Date.now()) return;
    const id = setInterval(() => {
      const remaining = Math.ceil((lockUntilRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockRemaining(0);
        setState("idle");
        setFailCount(0);
        clearInterval(id);
      } else setLockRemaining(remaining);
    }, 500);
    return () => clearInterval(id);
  }, [state]);

  const handleClick = useCallback(async () => {
    if (state !== "idle") return;
    setState("verifying");
    setProgress(0);

    try {
      const started = Date.now();
      const solutions: number[] = [];
      for (let i = 0; i < challenges; i++) {
        const salt = crypto.randomUUID().replace(/-/g, "") + Date.now().toString(36);
        const nonce = await solveChallenge(salt, difficulty);
        solutions.push(nonce);
        setProgress(Math.round(((i + 1) / challenges) * 100));
      }
      const elapsed = Date.now() - started;
      // suspicious if solved unrealistically fast (likely a script bypass)
      if (elapsed < 80) throw new Error("too fast");

      setState("verified");
      setFailCount(0);
      const token = btoa(JSON.stringify({ siteKey, t: Date.now(), elapsed, solutions: solutions.length }));
      onVerify?.(token);
    } catch {
      const newFails = failCount + 1;
      setFailCount(newFails);
      if (newFails >= 5) {
        lockUntilRef.current = Date.now() + 60_000;
        setLockRemaining(60);
        setState("locked");
      } else {
        setState("failed");
        setTimeout(() => setState("idle"), 1800);
      }
    }
  }, [state, siteKey, onVerify, failCount, difficulty, challenges]);

  // ----- Locked -----
  if (state === "locked") {
    return (
      <div
        className="w-[300px] rounded-md border border-red-200 bg-white px-3 py-3 select-none shadow-sm"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <div className="flex items-center">
          <div className="w-7 h-7 rounded border-2 border-red-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </div>
          <div className="ml-3 flex flex-col">
            <span className="text-xs font-medium text-red-600">您錯誤了太多次</span>
            <span className="text-[10px] text-gray-500">請 {lockRemaining} 秒後再試</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 text-center">
          <span className="text-[10px] tracking-wider text-gray-400">Powered By NobotCAPTCHA</span>
        </div>
      </div>
    );
  }

  // ----- Main -----
  return (
    <div
      className="w-[300px] rounded-md border border-gray-200 bg-white px-3 py-3 select-none shadow-sm"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div className="flex items-center">
        <button
          onClick={handleClick}
          disabled={state !== "idle"}
          className="w-7 h-7 rounded border-2 border-gray-300 bg-white flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-indigo-500 disabled:cursor-default shrink-0"
          aria-label="點擊驗證"
        >
          {state === "verifying" && (
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          )}
          {state === "verified" && (
            <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4,10 8,14 16,6" />
            </svg>
          )}
          {state === "failed" && (
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          )}
        </button>

        <span className="ml-3 text-sm text-gray-800">
          {state === "verifying" && `驗證中… ${progress}%`}
          {state === "verified" && <span className="text-green-600">驗證成功</span>}
          {state === "failed" && <span className="text-red-600">驗證失敗，請重試</span>}
          {state === "idle" && "我不是機器人"}
        </span>
      </div>

      {state === "verifying" && (
        <div className="mt-2 h-1 w-full bg-gray-100 rounded overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-gray-100 text-center">
        <span className="text-[10px] tracking-wider text-gray-400">Powered By NobotCAPTCHA</span>
      </div>
    </div>
  );
}
