import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Plus, Trash2, Eye, EyeOff, Check, Code, Shield } from "lucide-react";
import { toast } from "sonner";

type Site = {
  id: string;
  domain: string;
  site_key: string;
  secret_key: string;
  user_id: string;
  created_at: string;
  captcha_type: "checkbox" | "image" | "text";
  difficulty: "easy" | "medium" | "hard" | "extreme";
};

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
      <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10">
        {copied ? <Check className="w-3.5 h-3.5 text-nobot-green" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
        <code className="font-mono text-foreground/90">{code}</code>
      </pre>
    </div>
  );
}

const CAPTCHA_TYPES = [
  { value: "checkbox" as const, label: "✅ 一般勾選", desc: "一鍵驗證，最簡潔" },
  { value: "image" as const, label: "🖼️ 圖片驗證", desc: "選出正確圖案" },
  { value: "text" as const, label: "🔤 文字驗證", desc: "輸入扭曲文字" },
];

const DIFFICULTY_LEVELS = [
  { value: "easy" as const, label: "簡易", desc: "低干擾，快速通過", color: "text-nobot-green" },
  { value: "medium" as const, label: "中等", desc: "標準難度，推薦", color: "text-primary" },
  { value: "hard" as const, label: "困難", desc: "高干擾，更安全", color: "text-orange-500" },
  { value: "extreme" as const, label: "極其困難", desc: "最高安全等級", color: "text-destructive" },
];

export default function DashboardApiKeys() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [newType, setNewType] = useState<"checkbox" | "image" | "text">("checkbox");
  const [newDifficulty, setNewDifficulty] = useState<"easy" | "medium" | "hard" | "extreme">("medium");
  const [loading, setLoading] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  const fetchSites = async () => {
    if (!user) return;
    const { data } = await supabase.from("sites").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSites((data as any) || []);
  };

  useEffect(() => { fetchSites(); }, [user]);

  const addSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDomain.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("sites").insert({
      user_id: user.id,
      domain: newDomain.trim(),
      captcha_type: newType,
      difficulty: newDifficulty,
    } as any);
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

  const updateCaptchaType = async (id: string, type: "checkbox" | "image" | "text") => {
    const { error } = await supabase.from("sites").update({ captcha_type: type } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("驗證類型已更新");
    fetchSites();
  };

  const updateDifficulty = async (id: string, difficulty: "easy" | "medium" | "hard" | "extreme") => {
    const { error } = await supabase.from("sites").update({ difficulty } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("難度已更新");
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

  const getEmbedCode = (siteKey: string, type: string) => {
    const typeAttr = type !== "checkbox" ? `\n     data-type="${type}"` : "";
    return `<script src="${supabaseUrl}/functions/v1/sdk" async defer></script>
<div class="nobot-captcha"
     data-sitekey="${siteKey}"${typeAttr}></div>`;
  };

  const getServerCode = (secretKey: string) =>
`const r = await fetch('${supabaseUrl}/functions/v1/siteverify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret: '${secretKey}', token })
});
const result = await r.json();
// result.success && result.score > 0.5 → 人類`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">API 密鑰</h1>

      {/* Add domain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">新增網站</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addSite} className="flex gap-3">
            <Input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="example.com" className="flex-1" />
            <Button type="submit" disabled={loading} size="sm">
              <Plus className="w-4 h-4 mr-1" /> 新增
            </Button>
          </form>

          {/* Captcha type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">驗證類型</Label>
            <div className="flex gap-2">
              {CAPTCHA_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setNewType(t.value)}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all text-sm ${
                    newType === t.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/30"
                  }`}>
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs mt-0.5 opacity-70">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">驗證難度</Label>
            <div className="flex gap-2">
              {DIFFICULTY_LEVELS.map(d => (
                <button key={d.value} type="button" onClick={() => setNewDifficulty(d.value)}
                  className={`flex-1 p-2.5 rounded-lg border text-center transition-all text-sm ${
                    newDifficulty === d.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/30"
                  }`}>
                  <div className={`font-medium text-xs ${d.color}`}>{d.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sites list */}
      {sites.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{site.domain}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {CAPTCHA_TYPES.find(t => t.value === site.captcha_type)?.label || "✅ 一般勾選"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-secondary/50 ${
                      DIFFICULTY_LEVELS.find(d => d.value === site.difficulty)?.color || "text-primary"
                    }`}>
                      {DIFFICULTY_LEVELS.find(d => d.value === site.difficulty)?.label || "中等"}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteSite(site.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Change captcha type */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">切換驗證類型</Label>
                  <div className="flex gap-2">
                    {CAPTCHA_TYPES.map(t => (
                      <button key={t.value} type="button" onClick={() => updateCaptchaType(site.id, t.value)}
                        className={`px-3 py-1.5 rounded-md border text-xs transition-all ${
                          site.captcha_type === t.value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"
                        }`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change difficulty */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">調整難度</Label>
                  <div className="flex gap-2">
                    {DIFFICULTY_LEVELS.map(d => (
                      <button key={d.value} type="button" onClick={() => updateDifficulty(site.id, d.value)}
                        className={`px-3 py-1.5 rounded-md border text-xs transition-all ${
                          site.difficulty === d.value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"
                        }`}>
                        <span className={d.color}>{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keys */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Site Key（前端公開金鑰）</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-secondary/50 px-3 py-2 rounded text-xs font-mono truncate">{site.site_key}</code>
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(site.site_key, "Site Key")}><Copy className="w-3.5 h-3.5" /></Button>
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
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(site.secret_key, "Secret Key")}><Copy className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>

                {/* Integration code */}
                <div className="border-t border-border pt-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Code className="w-4 h-4" /> 嵌入代碼
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-2 block">📄 前端（加入 HTML）</Label>
                    <CopyBlock code={getEmbedCode(site.site_key, site.captcha_type)} label="前端嵌入碼" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-2 block">⚙️ 後端驗證</Label>
                    <CopyBlock code={getServerCode(site.secret_key)} label="後端驗證碼" />
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <h4 className="text-xs font-semibold text-primary mb-1.5">📋 快速參考</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• <strong className="text-foreground">分數判定</strong>：score &gt; 0.5 為人類</li>
                      <li>• 回傳含 behavior、ip_reputation、fingerprint、cookie 等多維度評分</li>
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
