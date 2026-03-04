import { useState, useEffect, useRef, useCallback } from "react";
import { Shield } from "lucide-react";

type WidgetState = "idle" | "verifying" | "verified" | "failed";

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

  const analyzeBehavior = useCallback((): { isHuman: boolean; score: number } => {
    const moves = mouseMovements.current;

    // Check minimum mouse movements
    if (moves.length < 3) return { isHuman: false, score: 0.1 };

    // Check reaction time (too fast = bot)
    const reactionTime = Date.now() - startTime.current;
    if (reactionTime < 400) return { isHuman: false, score: 0.1 };

    // Check for straight-line movement (bot signature)
    if (moves.length >= 3) {
      let totalDeviation = 0;
      for (let i = 1; i < moves.length - 1; i++) {
        const prev = moves[i - 1];
        const curr = moves[i];
        const next = moves[i + 1];
        // Calculate deviation from straight line
        const expectedX = prev.x + (next.x - prev.x) * ((curr.t - prev.t) / (next.t - prev.t || 1));
        const expectedY = prev.y + (next.y - prev.y) * ((curr.t - prev.t) / (next.t - prev.t || 1));
        totalDeviation += Math.sqrt((curr.x - expectedX) ** 2 + (curr.y - expectedY) ** 2);
      }
      const avgDeviation = totalDeviation / (moves.length - 2);
      // Humans have irregular, curved paths with higher deviation
      if (avgDeviation < 0.5 && moves.length > 5) return { isHuman: false, score: 0.2 };
    }

    // Check for speed variation (humans accelerate/decelerate)
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
      // Very low variance = robotic movement
      if (speedVariance < 0.001 && speeds.length > 5) return { isHuman: false, score: 0.3 };
    }

    return { isHuman: true, score: 0.9 };
  }, []);

  const handleClick = useCallback(() => {
    if (state !== "idle") return;
    setState("verifying");

    setTimeout(() => {
      const { isHuman, score } = demo ? { isHuman: true, score: 0.9 } : analyzeBehavior();

      if (isHuman) {
        setState("verified");
        const token = btoa(JSON.stringify({
          siteKey,
          timestamp: Date.now(),
          score,
          movements: mouseMovements.current.length,
        }));
        onVerify?.(token);
      } else {
        setState("failed");
        setTimeout(() => setState("idle"), 2000);
      }
    }, 1500);
  }, [state, siteKey, onVerify, demo, analyzeBehavior]);

  return (
    <div
      ref={widgetRef}
      className="w-[300px] h-[74px] rounded-md border border-border bg-card flex items-center px-3 select-none shadow-lg"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Checkbox area */}
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

      {/* Label */}
      <span className="ml-3 text-sm text-foreground/80 select-none">
        {state === "failed" ? "驗證失敗，請重試" : "我不是機器人"}
      </span>

      {/* Branding */}
      <div className="ml-auto flex flex-col items-center gap-0.5">
        <Shield className="w-6 h-6 text-primary" />
        <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">Nobot</span>
      </div>
    </div>
  );
}
