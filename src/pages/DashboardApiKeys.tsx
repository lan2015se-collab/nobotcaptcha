import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Plus, Trash2, Eye, EyeOff, Check, Code } from "lucide-react";
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
        className="absolute top-2 right-2 p-1.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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

  const getEmbedHtml = (siteKey: string) =>
`<!-- Step 1: 在 <head> 中加入 SDK -->
<script src="https://cdn.nobot.io/v1/api.js" async defer></script>

<!-- Step 2: 在表單中加入驗證框 -->
<form action="/your-endpoint" method="POST">
  <input type="text" name="email" placeholder="Email" />

  <div class="nobot-captcha"
       data-sitekey="${siteKey}">
  </div>

  <button type="submit">提交</button>
</form>`;

  const getServerCode = (secretKey: string) =>
`// Step 3: 後端驗證 (Node.js / Express 範例)
app.post('/your-endpoint', async (req, res) => {
  const token = req.body['nobot-response'];

  const response = await fetch(
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

  const result = await response.json();

  if (result.success && result.score > 0.5) {
    res.json({ message: '驗證成功！' });
  } else {
    res.status(403).json({ error: '驗證失敗' });
  }
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
                    <Label className="text-xs text-muted-foreground">Site Key（前端）</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-secondary/50 px-3 py-2 rounded text-xs font-mono truncate">{site.site_key}</code>
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(site.site_key, "Site Key")}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Secret Key（後端）</Label>
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

                {/* Usage instructions */}
                <div className="border-t border-border pt-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Code className="w-4 h-4" />
                    如何嵌入到你的網站
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">前端 HTML 嵌入碼</Label>
                    <CopyBlock code={getEmbedHtml(site.site_key)} label="HTML 嵌入碼" />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">後端驗證範例 (Node.js)</Label>
                    <CopyBlock code={getServerCode(site.secret_key)} label="後端驗證碼" />
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
