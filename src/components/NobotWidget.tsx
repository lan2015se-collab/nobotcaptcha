import { useState, useEffect, useRef, useCallback } from "react";

type WidgetState = "idle" | "verifying" | "verified" | "failed" | "locked";

interface NobotWidgetProps {
  siteKey?: string;
  onVerify?: (token: string) => void;
  demo?: boolean;
  level?: "easy" | "medium" | "hard" | "extreme";
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://buexhnmwraxzbtjymzwf.supabase.co";

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function solve(
  salt: string,
  difficulty: number,
  onTick?: (p: number) => void
): Promise<number> {
  const prefix = "0".repeat(difficulty);
  let nonce = 0;
  const MAX = 5_000_000;
  const expected = Math.pow(16, difficulty);
  while (nonce < MAX) {
    const h = await sha256Hex(salt + nonce);
    if (h.startsWith(prefix)) return nonce;
    nonce++;
    if (onTick && nonce % 8 === 0) {
      onTick(Math.min(95, Math.round((nonce / expected) * 100)));
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  throw new Error("pow-timeout");
}

export function NobotWidget({
  siteKey = "demo",
  onVerify,
  demo = false,
  level = "medium",
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

  const notifyFailure = useCallback(async () => {
    if (demo || !siteKey || siteKey === "demo") return;
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/notify-failure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteKey, domain: window.location.hostname }),
      });
    } catch {}
  }, [demo, siteKey]);

  const handleClick = useCallback(async () => {
    if (state !== "idle") return;
    setState("verifying");
    setProgress(0);
    await new Promise((r) => setTimeout(r, 16));

    try {
      // 1. Get challenge from server
      const chRes = await fetch(`${SUPABASE_URL}/functions/v1/pow?level=${level}`);
      if (!chRes.ok) throw new Error("challenge-failed");
      const ch = await chRes.json();

      // 2. Solve PoW
      const nonce = await solve(ch.salt, ch.difficulty, (p) => setProgress(p));
      setProgress(100);

      // 3. Submit for verification
      const vRes = await fetch(`${SUPABASE_URL}/functions/v1/pow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ch, nonce }),
      });
      const v = await vRes.json();
      if (!v.ok) throw new Error(v.error || "verify-failed");

      setState("verified");
      setFailCount(0);
      onVerify?.(v.token);
    } catch (err) {
      const newFails = failCount + 1;
      setFailCount(newFails);
      if (newFails >= 5) {
        lockUntilRef.current = Date.now() + 60_000;
        setLockRemaining(60);
        setState("locked");
        notifyFailure();
      } else {
        setState("failed");
        setTimeout(() => setState("idle"), 1800);
      }
    }
  }, [state, level, failCount, onVerify, notifyFailure]);

  if (state === "locked") {
    return (
      <div className="w-[300px] rounded-md border border-red-200 bg-white px-3 py-3 select-none shadow-sm"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
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

  return (
    <div className="w-[300px] rounded-md border border-gray-200 bg-white px-3 py-3 select-none shadow-sm"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="flex items-center">
        <button onClick={handleClick} disabled={state !== "idle"}
          className="w-7 h-7 rounded border-2 border-gray-300 bg-white flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-indigo-500 disabled:cursor-default shrink-0"
          aria-label="點擊驗證">
          {state === "verifying" && <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
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
