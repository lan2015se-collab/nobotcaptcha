import { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw, Cat, Dog, Car, Bus, Bike, Plane, Train, Ship,
  Apple, Cake, Pizza, Coffee, Grape, Cherry,
  TreePine, Flower2, Leaf, Sun, Moon, Cloud, Star, Heart,
} from "lucide-react";

type CaptchaState = "loading" | "ready" | "verifying" | "verified" | "failed" | "locked";

interface ImageCaptchaDemoProps {
  demo?: boolean;
  difficulty?: "easy" | "medium" | "hard" | "extreme";
}

type IconDef = { Icon: typeof Cat; label: string; group: string };

// group → semantically similar/related icons (for "包含/類似" matching)
const POOL: IconDef[] = [
  { Icon: Cat, label: "貓", group: "animal" },
  { Icon: Dog, label: "狗", group: "animal" },
  { Icon: Car, label: "汽車", group: "vehicle" },
  { Icon: Bus, label: "巴士", group: "vehicle" },
  { Icon: Bike, label: "腳踏車", group: "vehicle" },
  { Icon: Plane, label: "飛機", group: "vehicle" },
  { Icon: Train, label: "火車", group: "vehicle" },
  { Icon: Ship, label: "船", group: "vehicle" },
  { Icon: Apple, label: "蘋果", group: "food" },
  { Icon: Cake, label: "蛋糕", group: "food" },
  { Icon: Pizza, label: "披薩", group: "food" },
  { Icon: Coffee, label: "咖啡", group: "food" },
  { Icon: Grape, label: "葡萄", group: "food" },
  { Icon: Cherry, label: "櫻桃", group: "food" },
  { Icon: TreePine, label: "樹", group: "nature" },
  { Icon: Flower2, label: "花", group: "nature" },
  { Icon: Leaf, label: "葉子", group: "nature" },
  { Icon: Sun, label: "太陽", group: "sky" },
  { Icon: Moon, label: "月亮", group: "sky" },
  { Icon: Cloud, label: "雲", group: "sky" },
  { Icon: Star, label: "星星", group: "sky" },
  { Icon: Heart, label: "愛心", group: "symbol" },
];

const PROMPTS: { group: string; label: string }[] = [
  { group: "vehicle", label: "交通工具" },
  { group: "animal",  label: "動物" },
  { group: "food",    label: "食物" },
  { group: "nature",  label: "植物" },
  { group: "sky",     label: "天空中的物體" },
];

const diffConfig = {
  easy:    { targets: [2, 3], distractorVariety: 2 },
  medium:  { targets: [3, 4], distractorVariety: 3 },
  hard:    { targets: [4, 5], distractorVariety: 4 },
  extreme: { targets: [4, 6], distractorVariety: 5 },
};

const randi = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

interface Tile { id: number; def: IconDef; isTarget: boolean; }

function buildChallenge(difficulty: "easy" | "medium" | "hard" | "extreme") {
  const cfg = diffConfig[difficulty];
  const prompt = PROMPTS[randi(0, PROMPTS.length - 1)];
  const targetPool = POOL.filter((p) => p.group === prompt.group);
  const distractorPool = POOL.filter((p) => p.group !== prompt.group);
  const targetCount = randi(cfg.targets[0], cfg.targets[1]);
  const targets: IconDef[] = [];
  for (let i = 0; i < targetCount; i++) {
    targets.push(targetPool[randi(0, targetPool.length - 1)]);
  }
  const distractors: IconDef[] = [];
  const variety = shuffle(distractorPool).slice(0, cfg.distractorVariety);
  for (let i = 0; i < 9 - targetCount; i++) {
    distractors.push(variety[randi(0, variety.length - 1)]);
  }
  const tiles: Tile[] = shuffle([
    ...targets.map((def) => ({ def, isTarget: true })),
    ...distractors.map((def) => ({ def, isTarget: false })),
  ]).map((t, id) => ({ ...t, id }));
  return { prompt, tiles };
}

export function ImageCaptchaDemo({ difficulty = "medium" }: ImageCaptchaDemoProps) {
  const [state, setState] = useState<CaptchaState>("loading");
  const [challenge, setChallenge] = useState<ReturnType<typeof buildChallenge> | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [failCount, setFailCount] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const id = setInterval(() => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockRemaining(0);
        setFailCount(0);
        load();
        clearInterval(id);
      } else setLockRemaining(remaining);
    }, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockUntil]);

  const load = useCallback(() => {
    setState("loading");
    setSelected(new Set());
    setErrorMsg("");
    // small delay for spinner
    setTimeout(() => {
      setChallenge(buildChallenge(difficulty));
      setState("ready");
    }, 250);
  }, [difficulty]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: number) => {
    if (state !== "ready") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const verify = () => {
    if (!challenge || state !== "ready") return;
    setState("verifying");
    setTimeout(() => {
      const targetIds = new Set(challenge.tiles.filter((t) => t.isTarget).map((t) => t.id));
      const ok =
        selected.size === targetIds.size &&
        [...selected].every((id) => targetIds.has(id));
      if (ok) {
        setState("verified");
        setFailCount(0);
      } else {
        const f = failCount + 1;
        setFailCount(f);
        if (f >= 5) {
          setLockUntil(Date.now() + 60000);
          setLockRemaining(60);
          setState("locked");
        } else {
          setErrorMsg("選擇錯誤，請再試一次");
          setState("failed");
          setTimeout(() => load(), 900);
        }
      }
    }, 350);
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
        <div className="text-xs text-gray-500">請選出所有</div>
        <div className="text-sm font-semibold text-gray-900">
          {challenge ? challenge.prompt.label : "—"}
        </div>
      </div>

      <div className="p-3">
        {state === "loading" || !challenge ? (
          <div className="w-full h-[270px] rounded bg-gray-50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {challenge.tiles.map((tile) => {
              const isSel = selected.has(tile.id);
              const { Icon } = tile.def;
              return (
                <button
                  key={tile.id}
                  onClick={() => toggle(tile.id)}
                  className={`relative aspect-square rounded border-2 flex items-center justify-center transition-all ${
                    isSel
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                  aria-pressed={isSel}
                >
                  <Icon className={`w-8 h-8 ${isSel ? "text-indigo-600" : "text-gray-700"}`} strokeWidth={1.7} />
                  {isSel && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4,10 8,14 16,6" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {errorMsg && <p className="mt-2 text-xs text-red-500 text-center">{errorMsg}</p>}
      </div>

      <div className="px-3 py-2 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-1.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-500" aria-label="換一組">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] tracking-wider text-gray-400">Powered By NobotCAPTCHA</span>
        </div>
        <button
          onClick={verify}
          disabled={state !== "ready" || selected.size === 0}
          className="px-5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "verifying" ? "驗證中..." : "驗證"}
        </button>
      </div>
    </div>
  );
}
