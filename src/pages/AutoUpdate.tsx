import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, RefreshCw, Zap } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://buexhnmwraxzbtjymzwf.supabase.co";
const SDK_URL = `${SUPABASE_URL}/functions/v1/sdk`;

interface SdkInfo {
  version: string;
  built_at: string;
  size_bytes: number;
  source: string;
}

export default function AutoUpdate() {
  const [info, setInfo] = useState<SdkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`${SDK_URL}?info=1&_=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setInfo(await r.json());
    } catch (e: any) {
      setErr(e?.message || "fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const copy = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-3">
            <Zap className="w-3.5 h-3.5" /> 自動更新
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">SDK 自動更新</h1>
          <p className="text-muted-foreground">
            所有使用 NobotCAPTCHA 的網站都從同一個端點載入最新版 SDK。每次我們發布新版，您網站上的驗證元件會在下次重新整理時自動套用新樣式與安全性更新 — 您不需要修改任何程式碼。
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">目前線上版本</div>
              {loading ? (
                <div className="text-2xl font-mono">載入中…</div>
              ) : err ? (
                <div className="text-red-600 text-sm">無法取得：{err}</div>
              ) : info ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-3xl font-mono font-bold">v{info.version}</div>
                  <Badge variant="secondary">{(info.size_bytes / 1024).toFixed(1)} KB</Badge>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">即時供應 · 無快取</Badge>
                </div>
              ) : null}
              {info && (
                <div className="text-xs text-muted-foreground mt-2">
                  建置時間：{new Date(info.built_at).toLocaleString("zh-TW")}
                </div>
              )}
            </div>
            <Button onClick={load} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> 重新檢查
            </Button>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 flex items-center gap-2">
            <code className="flex-1 text-xs font-mono break-all">{SDK_URL}</code>
            <Button size="sm" variant="ghost" onClick={() => copy(SDK_URL, "已複製端點 URL")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold mb-3">在您的網站上嵌入</h2>
          <p className="text-sm text-muted-foreground mb-3">
            把下面這行貼到 <code className="text-xs">&lt;head&gt;</code> 或 <code className="text-xs">&lt;body&gt;</code> 結尾。瀏覽器每次載入時都會抓最新版。
          </p>
          <div className="rounded-md bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto relative">
            <button
              className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700"
              onClick={() => copy(`<script src="${SDK_URL}" async defer></script>`, "已複製")}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <pre>{`<script src="${SDK_URL}" async defer></script>

<div class="nobot-captcha"
     data-sitekey="YOUR_SITE_KEY"
     data-type="checkbox"
     data-level="medium"></div>`}</pre>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">目前 SDK 原始碼</h2>
            {info && (
              <Button size="sm" variant="outline" onClick={() => copy(info.source, "已複製 SDK 程式碼")}>
                <Copy className="w-4 h-4 mr-2" /> 複製全部
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            這是這一秒鐘從端點實際送出的 JavaScript。每次發布新版，這份內容會自動更新 — 不需要任何手動操作。
          </p>
          <div className="rounded-md bg-slate-900 text-slate-100 p-4 text-[11px] font-mono overflow-auto max-h-[480px]">
            {loading ? "載入中…" : err ? `錯誤：${err}` : <pre className="whitespace-pre-wrap break-all">{info?.source}</pre>}
          </div>
        </Card>

        <div className="mt-6 text-center text-sm">
          <Link to="/change-log" className="text-primary hover:underline">查看完整更新歷史 →</Link>
        </div>
      </main>
    </div>
  );
}
