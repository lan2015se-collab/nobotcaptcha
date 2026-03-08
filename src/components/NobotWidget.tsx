import { useState, useEffect, useRef, useCallback } from "react";
import { Shield } from "lucide-react";

type WidgetState = "idle" | "verifying" | "verified" | "failed" | "locked";

interface MousePoint {
  x: number;
  y: number;
  t: number;
}

interface NobotWidgetProps {
  siteKey?: string;
  onVerify?: (token: string) => void;
  demo?: boolean;
}

export function NobotWidget({ siteKey = "demo", onVerify, demo = false }: NobotWidgetProps) {
  const [state, setState] = useState<WidgetState>("idle");
  const [failCount, setFailCount] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  const lockUntilRef = useRef(0);
  const mouseMovements = useRef<MousePoint[]>([]);
  const startTime = useRef(Date.now());
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mouseMovements.current.length < 50) {
        mouseMovements.current.push({
          x: e.clientX,
          y: e.clientY,
          t: Date.now() - startTime.current,
        });
      }
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Lock timer
  useEffect(() => {
    if (lockUntilRef.current <= Date.now()) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockUntilRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockRemaining(0);
        setState("idle");
        setFailCount(0);
        clearInterval(interval);
      } else {
        setLockRemaining(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [state]);

  const analyzeBehavior = useCallback((): { isHuman: boolean; score: number } => {
    const moves = mouseMovements.current;
    if (moves.length < 3) return { isHuman: false, score: 0.1 };
    const reactionTime = Date.now() - startTime.current;
    if (reactionTime < 400) return { isHuman: false, score: 0.1 };

    if (moves.length >= 3) {
      let totalDeviation = 0;
      for (let i = 1; i < moves.length - 1; i++) {
        const prev = moves[i - 1];
        const curr = moves[i];
        const next = moves[i + 1];
        const expectedX = prev.x + (next.x - prev.x) * ((curr.t - prev.t) / (next.t - prev.t || 1));
        const expectedY = prev.y + (next.y - prev.y) * ((curr.t - prev.t) / (next.t - prev.t || 1));
        totalDeviation += Math.sqrt((curr.x - expectedX) ** 2 + (curr.y - expectedY) ** 2);
      }
      const avgDeviation = totalDeviation / (moves.length - 2);
      if (avgDeviation < 0.5 && moves.length > 5) return { isHuman: false, score: 0.2 };
    }

    if (moves.length >= 4) {
      const speeds: number[] = [];
      for (let i = 1; i < moves.length; i++) {
        const dx = moves[i].x - moves[i - 1].x;
        const dy = moves[i].y - moves[i - 1].y;
        const dt = moves[i].t - moves[i - 1].t || 1;
        speeds.push(Math.sqrt(dx * dx + dy * dy) / dt);
      }
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      const speedVariance = speeds.reduce((a, b) => a + (b - avgSpeed) ** 2, 0) / speeds.length;
      if (speedVariance < 0.001 && speeds.length > 5) return { isHuman: false, score: 0.3 };
    }

    return { isHuman: true, score: 0.9 };
  }, []);

  const handleClick = useCallback(() => {
    if (state !== "idle") return;
    setState("verifying");

    setTimeout(() => {
      const { isHuman, score } = analyzeBehavior();

      if (isHuman) {
        setState("verified");
        setFailCount(0);
        const token = btoa(JSON.stringify({
          siteKey,
          timestamp: Date.now(),
          score,
          movements: mouseMovements.current.length,
        }));
        onVerify?.(token);
      } else {
        const newFails = failCount + 1;
        setFailCount(newFails);
        if (newFails >= 5) {
          const until = Date.now() + 60000;
          lockUntilRef.current = until;
          setLockRemaining(60);
          setState("locked");
        } else {
          setState("failed");
          setTimeout(() => setState("idle"), 2000);
        }
      }
    }, 1500);
  }, [state, siteKey, onVerify, analyzeBehavior, failCount]);

  if (state === "locked") {
    return (
      <div
        ref={widgetRef}
        className="w-[300px] h-[74px] rounded-md border border-destructive/50 bg-card flex items-center px-3 select-none shadow-lg"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <div className="w-7 h-7 rounded border-2 border-destructive flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-destructive" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="5" y1="5" x2="15" y2="15" />
            <line x1="15" y1="5" x2="5" y2="15" />
          </svg>
        </div>
        <div className="ml-3 flex flex-col">
          <span className="text-xs font-medium text-destructive">您錯誤了太多次</span>
          <span className="text-[10px] text-muted-foreground">請 {lockRemaining} 秒後再試</span>
        </div>
        <div className="ml-auto flex flex-col items-center gap-0.5">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">Nobot</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={widgetRef}
      className="w-[300px] h-[74px] rounded-md border border-border bg-card flex items-center px-3 select-none shadow-lg"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <button
        onClick={handleClick}
        disabled={state === "verified"}
        className="w-7 h-7 rounded border-2 border-muted-foreground/40 bg-secondary flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-primary disabled:cursor-default shrink-0"
        aria-label="Verify you are human"
      >
        {state === "idle" && <span className="sr-only">Click to verify</span>}
        {state === "verifying" && (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin-slow" />
        )}
        {state === "verified" && (
          <svg className="w-5 h-5 text-nobot-green animate-check-in" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4,10 8,14 16,6" />
          </svg>
        )}
        {state === "failed" && (
          <svg className="w-5 h-5 text-destructive" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="5" y1="5" x2="15" y2="15" />
            <line x1="15" y1="5" x2="5" y2="15" />
          </svg>
        )}
      </button>

      <span className="ml-3 text-sm text-foreground/80 select-none">
        {state === "failed" ? "驗證失敗，請重試" : "我不是機器人"}
      </span>

      <div className="ml-auto flex flex-col items-center gap-0.5">
        <Shield className="w-6 h-6 text-primary" />
        <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">Nobot</span>
      </div>
    </div>
  );
}
