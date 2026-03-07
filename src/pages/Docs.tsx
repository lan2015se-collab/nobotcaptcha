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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://buexhnmwraxzbtjymzwf.supabase.co';

const sections = [
  {
    id: "install",
    title: "1. 安裝 SDK",
    description: "在 HTML 的 <head> 中加入一行 Script 標籤，SDK 會自動載入並初始化行為監測引擎。",
    code: `<script src="${supabaseUrl}/functions/v1/sdk" async defer></script>`,
    lang: "html",
  },
  {
    id: "deploy",
    title: "2. 放入驗證框",
    description: "加入一個 div 並設定你的 Site Key。可透過 data-type 選擇驗證類型：checkbox（預設）、image（圖片）、text（文字）。",
    code: `<!-- 一般勾選驗證（預設）-->
<div class="nobot-captcha" data-sitekey="YOUR_SITE_KEY"></div>

<!-- 圖片驗證 -->
<div class="nobot-captcha" data-sitekey="YOUR_SITE_KEY" data-type="image"></div>

<!-- 扭曲文字驗證 -->
<div class="nobot-captcha" data-sitekey="YOUR_SITE_KEY" data-type="text"></div>`,
    lang: "html",
  },
  {
    id: "verify",
    title: "3. 後端驗證",
    description: "用戶通過驗證後，表單內會自動新增 nobot-response 欄位。將此 Token 連同 Secret Key 發送到驗證 API。",
    code: `const token = req.body['nobot-response'];

const res = await fetch('${supabaseUrl}/functions/v1/siteverify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    secret: process.env.NOBOT_SECRET_KEY,
    token: token
  })
});

const result = await res.json();
// result.success && result.score > 0.5 → 人類`,
    lang: "javascript",
  },
  {
    id: "response",
    title: "4. API 回應格式",
    description: "驗證 API 回傳綜合評分與各維度檢查結果，包含行為分析、IP 信譽、瀏覽器指紋和 Cookie 檢測。",
    code: `{
  "success": true,
  "score": 0.92,
  "challenge_ts": "2026-03-07T10:30:00Z",
  "hostname": "example.com",
  "checks": {
    "behavior": 0.90,
    "ip_reputation": 1.00,
    "fingerprint": 0.95,
    "cookie": true
  }
}`,
    lang: "json",
  },
  {
    id: "security",
    title: "5. 安全機制",
    description: "NobotCAPTCHA 使用六層防護：行為分析（滑鼠軌跡 + 速度變化）、Cookie 檢測、瀏覽器指紋（Canvas + WebGL）、IP 信譽追蹤、帳號歷史記錄、AI 加權綜合評分。",
    code: `// 後端評分權重
最終分數 = 
  行為分析 × 50%     // 滑鼠軌跡、速度變化
  + IP 信譽 × 15%    // 失敗歷史追蹤
  + 瀏覽器指紋 × 20% // Canvas、WebGL、插件
  + Cookie ± 5~10%   // 瀏覽器 Cookie 能力
  + 鍵盤活動 × 5%    // 有無鍵盤操作

判定：score > 0.5 → 人類
     score ≤ 0.5 → 機器人`,
    lang: "text",
  },
];

export default function Docs() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-4">
              <Shield className="w-3.5 h-3.5" />
              開發者文件
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">整合指南</h1>
            <p className="text-muted-foreground text-lg">
              兩行代碼即可部署，支援三種驗證模式，六層安全防護。
            </p>
          </div>

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
