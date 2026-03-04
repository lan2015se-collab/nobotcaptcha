import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function DashboardSettings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("user_id", user.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("個人資料已更新");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設置</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">個人資料</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="mt-1" />
            </div>
            <div>
              <Label>名稱</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} size="sm">
              {loading ? "儲存中..." : "儲存"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
