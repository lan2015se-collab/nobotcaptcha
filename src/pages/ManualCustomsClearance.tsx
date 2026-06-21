import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, Copy, Check, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

type Site = { id: string; domain: string; site_key: string; error_email: string | null };
type Generated = { siteId: string; code: string; expiresAt: number };

export default function ManualCustomsClearance() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Record<string, Generated>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?redirect=/manual-customs-clearance");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("sites").select("id,domain,site_key,error_email")
      .eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setSites((data as any) || []));
  }, [user]);

  const generate = async (siteId: string) => {
    setGenerating(siteId);
    const { data: sess } = await supabase.auth.getSession();
    const r = await supabase.functions.invoke("manual-passcode", {
      body: { action: "generate", siteId },
      headers: { Authorization: `Bearer ${sess.session?.access_token}` },
    });
    setGenerating(null);
    if (r.error || !r.data?.ok) { toast.error(r.data?.error || "生成失敗"); return; }
    const mins = r.data.expires_in_minutes ?? 30;
    setGenerated(prev => ({ ...prev, [siteId]: { siteId, code: r.data.code, expiresAt: Date.now() + mins * 60000 } }));
    toast.success("通關碼已生成（30 分鐘內有效，只能使用一次）");
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success("通關碼已複製");
    setTimeout(() => setCopied(null), 1500);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">人工通關</h1>
          <p className="text-sm text-muted-foreground">
            當 NobotCAPTCHA 服務異常時，為你的網站使用者生成一次性通關碼
          </p>
        </div>

        {sites.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              你尚未新增任何網站。請先到 控制台 → API 密鑰 新增網站。
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sites.map(s => {
              const g = generated[s.id];
              return (
                <Card key={s.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{s.domain}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        通知信箱：{s.error_email || "（未設定）"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {g ? (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-center font-mono text-2xl tracking-[0.4em] py-3 rounded-md bg-primary/5 border border-primary/20 text-primary">
                          {g.code}
                        </code>
                        <Button variant="outline" size="icon" onClick={() => copy(g.code)}>
                          {copied === g.code ? <Check className="w-4 h-4 text-nobot-green" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    ) : null}
                    <Button onClick={() => generate(s.id)} disabled={generating === s.id} className="w-full">
                      {generating === s.id
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 生成中…</>
                        : <><Sparkles className="w-4 h-4 mr-2" /> {g ? "重新生成" : "生成一次性通關碼"}</>}
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      將通關碼提供給你的網站使用者，貼入其驗證視窗即可通過驗證（30 分鐘內、單次有效）
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
