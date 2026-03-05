import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Plus, Trash2, Eye, EyeOff, Check, Code, FileCode, Server } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Site = Tables<"sites">;

function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`${label || "程式碼"} 已複製`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-lg border border-border bg-secondary/30 overflow-hidden">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-nobot-green" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
        <code className="font-mono text-foreground/90">{code}</code>
      </pre>
    </div>
  );
}

export default function DashboardApiKeys() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  const fetchSites = async () => {
    if (!user) return;
    const { data } = await supabase.from("sites").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSites(data || []);
  };

  useEffect(() => { fetchSites(); }, [user]);

  const addSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDomain.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("sites").insert({ user_id: user.id, domain: newDomain.trim() });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("網站已新增");
    setNewDomain("");
    fetchSites();
  };

  const deleteSite = async (id: string) => {
    const { error } = await supabase.from("sites").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("網站已刪除");
    fetchSites();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} 已複製`);
  };

  const toggleSecret = (id: string) => {
    setVisibleSecrets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://buexhnmwraxzbtjymzwf.supabase.co";

  const getFullHtml = (siteKey: string, domain: string) =>
`<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${domain} - NobotCAPTCHA 表單</title>
  <script src="${supabaseUrl}/functions/v1/sdk" async defer></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a; color: #e2e8f0;
      display: flex; justify-content: center; align-items: center;
      min-height: 100vh;
    }
    .form-container {
      background: #1e293b; border-radius: 12px;
      padding: 32px; width: 100%; max-width: 420px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    h2 { font-size: 1.5rem; margin-bottom: 24px; }
    label { display: block; font-size: 0.875rem; color: #94a3b8; margin-bottom: 6px; }
    input[type="text"], input[type="email"] {
      width: 100%; padding: 10px 14px; border-radius: 8px;
      border: 1px solid #334155; background: #0f172a;
      color: #e2e8f0; font-size: 0.95rem; margin-bottom: 16px;
      outline: none; transition: border-color 0.2s;
    }
    input:focus { border-color: #6366f1; }
    .nobot-captcha { margin: 20px 0; }
    button[type="submit"] {
      width: 100%; padding: 12px; border-radius: 8px;
      background: #6366f1; color: white; font-weight: 600;
      border: none; cursor: pointer; font-size: 1rem;
      transition: background 0.2s;
    }
    button[type="submit"]:hover { background: #4f46e5; }
    button[type="submit"]:disabled {
      opacity: 0.5; cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <h2>聯絡我們</h2>
    <form id="contact-form" action="/api/contact" method="POST">
      <label for="name">姓名</label>
      <input type="text" id="name" name="name" placeholder="請輸入您的姓名" required>

      <label for="email">電子郵件</label>
      <input type="email" id="email" name="email" placeholder="you@example.com" required>

      <label for="message">訊息</label>
      <input type="text" id="message" name="message" placeholder="請輸入您的訊息" required>

      <!-- NobotCAPTCHA 驗證框 -->
      <div class="nobot-captcha"
           data-sitekey="${siteKey}">
      </div>

      <button type="submit">送出表單</button>
    </form>
  </div>

  <script>
    document.getElementById('contact-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const token = form.querySelector('[name="nobot-response"]')?.value;

      if (!token) {
        alert('請先完成人機驗證');
        return;
      }

      // 將表單資料與 Token 送到你的後端
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.value,
          email: form.email.value,
          message: form.message.value,
          'nobot-response': token
        })
      });

      const result = await res.json();
      alert(result.message || '已送出！');
    });
  </script>
</body>
</html>`;

  const getServerCode = (secretKey: string) =>
`const express = require('express');
const app = express();
app.use(express.json());

// NobotCAPTCHA 後端驗證
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  const token = req.body['nobot-response'];

  // 1. 檢查 Token 是否存在
  if (!token) {
    return res.status(400).json({ 
      error: '請先完成人機驗證' 
    });
  }

  // 2. 向 NobotCAPTCHA API 驗證 Token
  const verifyResponse = await fetch(
    '${supabaseUrl}/functions/v1/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: '${secretKey}',
        token: token
      })
    }
  );

  const result = await verifyResponse.json();

  // 3. 根據驗證結果處理
  if (result.success && result.score > 0.5) {
    // ✅ 驗證通過 — 處理你的業務邏輯
    console.log('人類用戶:', { name, email, message });
    console.log('驗證分數:', result.score);

    // 在這裡加入你的業務邏輯
    // 例如：儲存到資料庫、發送郵件等

    res.json({ 
      message: '表單提交成功！',
      score: result.score 
    });
  } else {
    // ❌ 驗證失敗 — 疑似機器人
    console.warn('機器人偵測:', result);
    res.status(403).json({ 
      error: '驗證失敗，疑似機器人操作',
      score: result.score 
    });
  }
});

app.listen(3000, () => {
  console.log('伺服器已啟動: http://localhost:3000');
});`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">API 密鑰</h1>

      {/* Add domain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">新增網站</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addSite} className="flex gap-3">
            <Input
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1"
            />
            <Button type="submit" disabled={loading} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              新增
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sites list */}
      {sites.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>尚未新增任何網站</p>
          <p className="text-sm">新增你的網域以獲取 API 密鑰</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sites.map(site => (
            <Card key={site.id}>
              <CardContent className="pt-6 space-y-5">
                {/* Domain header */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{site.domain}</span>
                  <Button variant="ghost" size="icon" onClick={() => deleteSite(site.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Keys */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Site Key（前端公開金鑰）</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-secondary/50 px-3 py-2 rounded text-xs font-mono truncate">{site.site_key}</code>
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(site.site_key, "Site Key")}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Secret Key（後端私密金鑰）</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-secondary/50 px-3 py-2 rounded text-xs font-mono truncate">
                        {visibleSecrets.has(site.id) ? site.secret_key : "••••••••-••••-••••-••••-••••••••••••"}
                      </code>
                      <Button variant="outline" size="icon" onClick={() => toggleSecret(site.id)}>
                        {visibleSecrets.has(site.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(site.secret_key, "Secret Key")}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Complete integration code */}
                <div className="border-t border-border pt-5 space-y-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Code className="w-4 h-4" />
                    如何嵌入到你的網站
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    以下是為 <strong className="text-foreground">{site.domain}</strong> 準備好的完整代碼，你的 Site Key 和 Secret Key 已自動填入，可以直接複製使用。
                  </p>

                  {/* Step 1: Full HTML */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileCode className="w-4 h-4 text-nobot-green" />
                      <Label className="text-xs font-semibold text-foreground">Step 1：前端完整 HTML 頁面</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      建立一個新的 HTML 檔案（例如 <code className="bg-secondary/50 px-1.5 py-0.5 rounded text-foreground/80">contact.html</code>），
                      直接貼上以下代碼即可使用。已包含樣式、表單和驗證框。
                    </p>
                    <CopyBlock code={getFullHtml(site.site_key, site.domain)} label="完整 HTML 頁面" />
                  </div>

                  {/* Step 2: Server verification */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-4 h-4 text-nobot-green" />
                      <Label className="text-xs font-semibold text-foreground">Step 2：後端驗證伺服器 (Node.js)</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      建立 <code className="bg-secondary/50 px-1.5 py-0.5 rounded text-foreground/80">server.js</code>，
                      安裝 Express（<code className="bg-secondary/50 px-1.5 py-0.5 rounded text-foreground/80">npm install express</code>），
                      然後執行 <code className="bg-secondary/50 px-1.5 py-0.5 rounded text-foreground/80">node server.js</code> 啟動伺服器。
                    </p>
                    <CopyBlock code={getServerCode(site.secret_key)} label="完整後端驗證伺服器" />
                  </div>

                  {/* Quick reference */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <h4 className="text-xs font-semibold text-primary mb-2">📋 快速參考</h4>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li>• <strong className="text-foreground">Site Key</strong>：放在前端 HTML 的 <code className="bg-secondary/50 px-1 rounded">data-sitekey</code> 屬性</li>
                      <li>• <strong className="text-foreground">Secret Key</strong>：放在後端伺服器，用於呼叫驗證 API</li>
                      <li>• <strong className="text-foreground">驗證 API</strong>：<code className="bg-secondary/50 px-1 rounded text-foreground/70 break-all">{supabaseUrl}/functions/v1/siteverify</code></li>
                      <li>• <strong className="text-foreground">分數判定</strong>：score &gt; 0.5 為人類，≤ 0.5 為機器人</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
