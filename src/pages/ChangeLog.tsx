import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Shield, ArrowLeft, Calendar } from "lucide-react";

type Entry = {
  id: string;
  version: string;
  title: string;
  content: string;
  created_at: string;
};

export default function ChangeLog() {
  const { id } = useParams();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      supabase.from("changelog").select("*").eq("id", id).maybeSingle()
        .then(({ data }) => { setEntry(data as any); setLoading(false); });
    } else {
      supabase.from("changelog").select("*").eq("published", true).order("created_at", { ascending: false })
        .then(({ data }) => { setEntries((data as any) || []); setLoading(false); });
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold">NobotCAPTCHA</span>
          </Link>
          <span className="ml-auto text-sm text-muted-foreground">Change Log</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {id ? (
          <>
            <Link to="/change-log" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" /> 返回更新列表
            </Link>
            {loading ? (
              <p className="text-muted-foreground">載入中…</p>
            ) : !entry ? (
              <p className="text-muted-foreground">找不到此更新項目</p>
            ) : (
              <Card className="p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(entry.created_at).toLocaleString("zh-TW")}
                </div>
                <h1 className="text-2xl font-bold mb-1">{entry.title}</h1>
                <p className="text-sm text-primary font-mono mb-4">v{entry.version}</p>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90">
                  {entry.content}
                </div>
              </Card>
            )}
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">更新日誌</h1>
            <p className="text-muted-foreground mb-6">NobotCAPTCHA 所有產品更新與歷史紀錄</p>
            {loading ? (
              <p className="text-muted-foreground">載入中…</p>
            ) : entries.length === 0 ? (
              <p className="text-muted-foreground">尚無更新項目</p>
            ) : (
              <div className="space-y-3">
                {entries.map((e) => (
                  <Link key={e.id} to={`/change-log/${e.id}`}>
                    <Card className="p-5 hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(e.created_at).toLocaleDateString("zh-TW")}
                        <span className="text-primary font-mono ml-2">v{e.version}</span>
                      </div>
                      <h2 className="text-lg font-semibold mb-1">{e.title}</h2>
                      <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                        {e.content}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
