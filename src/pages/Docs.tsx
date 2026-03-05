import { Navbar } from "@/components/Navbar";
import { Shield, Copy, Check } from "lucide-react";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="absolute top-3 right-3 p-1.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-nobot-green" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, lang = "html" }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-lg border border-border bg-secondary/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border text-xs text-muted-foreground">
        <span className="uppercase font-mono">{lang}</span>
      </div>
      <CopyButton text={code} />
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="font-mono text-foreground/90">{code}</code>
      </pre>
    </div>
  );
}

const sections = [
  {
    id: "install",
    title: "1. 安裝",
    description: "在你的 HTML 頁面 <head> 中加入 NobotCAPTCHA 的 SDK script 標籤。這會自動載入驗證引擎並初始化滑鼠路徑監測。",
    code: `<head>
  <script src="${import.meta.env.VITE_SUPABASE_URL || 'https://buexhnmwraxzbtjymzwf.supabase.co'}/functions/v1/sdk" async defer></script>
</head>`,
    lang: "html",
  },
  {
    id: "deploy",
    title: "2. 部署驗證框",
    description: "在你的表單中加入 nobot-captcha 的容器元素。將 data-sitekey 替換為你從控制台取得的 Site Key。",
    code: `<form action="/submit" method="POST">
  <!-- 你的表單欄位 -->
  <input type="text" name="email" placeholder="Email" />

  <!-- NobotCAPTCHA 驗證框 -->
  <div class="nobot-captcha" 
       data-sitekey="YOUR_SITE_KEY">
  </div>

  <button type="submit">提交</button>
</form>`,
    lang: "html",
  },
  {
    id: "verify",
    title: "3. 後端驗證",
    description: "當用戶提交表單時，表單會包含一個 nobot-response 欄位。你的後端伺服器需要將此 Token 發送到 NobotCAPTCHA 的驗證 API 進行確認。",
    code: `// server.js (Node.js / Express)
const express = require('express');
const app = express();
app.use(express.json());

app.post('/submit', async (req, res) => {
  const token = req.body['nobot-response'];
  const secret = process.env.NOBOT_SECRET_KEY;

  if (!token) {
    return res.status(400).json({ 
      error: '請先完成驗證' 
    });
  }

  const response = await fetch(
    '${import.meta.env.VITE_SUPABASE_URL || 'https://buexhnmwraxzbtjymzwf.supabase.co'}/functions/v1/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, token })
    }
  );

  const result = await response.json();

  if (result.success && result.score > 0.5) {
    res.json({ message: '驗證成功！' });
  } else {
    res.status(403).json({ 
      error: '驗證失敗，疑似機器人' 
    });
  }
});

app.listen(3000);`,
    lang: "javascript",
  },
  {
    id: "mouse",
    title: "4. 滑鼠路徑監測原理",
    description: "NobotCAPTCHA 的核心是行為分析引擎。SDK 會自動捕捉用戶的滑鼠移動軌跡，分析以下特徵來區分人類與機器人：",
    code: `// 行為分析引擎 (簡化版)
analyzeBehavior(movements) {
  // 1️⃣ 移動次數檢查
  // 機器人通常直接點擊，沒有滑鼠移動
  if (movements.length < 3) return { score: 0.1 };

  // 2️⃣ 反應時間檢查
  // 腳本執行速度 < 400ms，人類通常 > 1s
  if (reactionTime < 400) return { score: 0.1 };

  // 3️⃣ 路徑曲線分析
  // 人類移動帶有微小曲線和不規則性
  // 機器人通常是絕對直線
  const deviation = calcPathDeviation(movements);
  if (deviation < 0.5) return { score: 0.2 };

  // 4️⃣ 速度變化分析
  // 人類會加速和減速
  // 機器人通常勻速移動
  const speedVariance = calcSpeedVariance(movements);
  if (speedVariance < 0.001) return { score: 0.3 };

  return { score: 0.9, isHuman: true };
}`,
    lang: "javascript",
  },
  {
    id: "response",
    title: "5. API 回應格式",
    description: "siteverify API 會回傳 JSON 格式的驗證結果，包含分數和時間戳。",
    code: `// 成功回應
{
  "success": true,
  "score": 0.9,
  "challenge_ts": "2026-03-04T15:00:00.000Z",
  "hostname": "example.com"
}

// 失敗回應
{
  "success": false,
  "score": 0.1,
  "error-codes": ["timeout-or-duplicate"]
}`,
    lang: "json",
  },
];

export default function Docs() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-4">
              <Shield className="w-3.5 h-3.5" />
              開發者文件
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">整合指南</h1>
            <p className="text-muted-foreground text-lg">
              三步驟即可在任何網站部署 NobotCAPTCHA 人機驗證。
            </p>
          </div>

          {/* Sections — dual column */}
          <div className="max-w-5xl mx-auto space-y-20">
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="grid lg:grid-cols-2 gap-8 items-start">
                <div>
                  <h2 className="text-xl font-bold mb-3">{section.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{section.description}</p>
                </div>
                <CodeBlock code={section.code} lang={section.lang} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
